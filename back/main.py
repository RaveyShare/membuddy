from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
from supabase import Client, create_client
from gotrue.errors import AuthApiError
import jwt
import logging
import uuid
import asyncio
from datetime import datetime, timedelta

from config import settings
from database import get_anon_supabase
import schemas
from gemini import generate_memory_aids, generate_review_schedule_from_ebbinghaus

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MemBuddy API")

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health Check ---
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# --- Dependencies ---
async def get_current_user(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: 'sub' claim missing")
        
        return {"id": user_id, "email": payload.get("email"), "full_name": payload.get("full_name", ""), "token": token}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def get_supabase_authed(current_user: dict = Depends(get_current_user)) -> Client:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    supabase.postgrest.auth(current_user['token'])
    return supabase

# --- Auth Routes ---
@app.post("/api/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, supabase: Client = Depends(get_anon_supabase)):
    try:
        res = supabase.auth.sign_up({"email": user.email, "password": user.password, "options": {"data": {"full_name": user.full_name}}})
        if res.user:
            return schemas.User(id=res.user.id, email=res.user.email, full_name=res.user.user_metadata.get("full_name", ""))
        raise HTTPException(status_code=400, detail="Could not register user.")
    except AuthApiError as e:
        raise HTTPException(status_code=e.status, detail=e.message)

@app.post("/api/auth/login")
def login(user: schemas.UserLogin, supabase: Client = Depends(get_anon_supabase)):
    try:
        res = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
        access_token = jwt.encode({"sub": str(res.user.id), "email": res.user.email, "full_name": res.user.user_metadata.get("full_name", ""),"exp": res.session.expires_at}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        return {"access_token": access_token, "token_type": "bearer"}
    except AuthApiError as e:
        raise HTTPException(status_code=e.status, detail=e.message)



@app.post("/api/auth/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(payload: schemas.ForgotPasswordPayload, supabase: Client = Depends(get_anon_supabase)):
    try:
        supabase.auth.reset_password_for_email(email=payload.email)
        return {"message": "Password reset email sent successfully."}
    except Exception as e:
        logger.error(f"Forgot password attempt for {payload.email} resulted in error: {e}")
        return {"message": "If an account with this email exists, a password reset link has been sent."}

# --- Memory Item CRUD ---
@app.get("/api/memory_items", response_model=List[schemas.MemoryItem])
def get_memory_items(skip: int = 0, limit: int = 100, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    # Step 1: Fetch main memory items
    items_res = supabase.table("memory_items").select("*").eq("user_id", current_user['id']).order("created_at", desc=True).range(skip, skip + limit - 1).execute()
    if not items_res.data:
        return []

    items_map = {item['id']: item for item in items_res.data}
    item_ids = list(items_map.keys())

    # Step 2: Fetch related memory aids for the retrieved items
    if item_ids:
        aids_res = supabase.table("memory_aids").select("*").in_("memory_item_id", item_ids).execute()
        for aid_data in aids_res.data:
            item_id = aid_data['memory_item_id']
            if item_id in items_map:
                # Structure the aids data as expected by the schema
                items_map[item_id]['memory_aids'] = {
                    "mindMap": json.loads(aid_data.get('mind_map_data', '{}')),
                    "mnemonics": json.loads(aid_data.get('mnemonics_data', '[]')),
                    "sensoryAssociations": json.loads(aid_data.get('sensory_associations_data', '[]'))
                }

    # Step 3: Validate and return the combined data
    final_items = [schemas.MemoryItem.model_validate(item) for item in items_map.values()]
    return final_items

@app.post("/api/memory_items", response_model=schemas.MemoryItem, status_code=status.HTTP_201_CREATED)
async def create_memory_item(item: schemas.MemoryItemCreate, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    user_id = current_user['id']
    
    # 1. Create the main memory item
    item_dict = item.model_dump(exclude_unset=True, exclude={'memory_aids'})
    item_dict['user_id'] = user_id
    if 'title' not in item_dict or not item_dict['title']:
        item_dict['title'] = item.content[:50]

    item_res = supabase.table("memory_items").insert(item_dict, returning="representation").execute()
    if not item_res.data:
        raise HTTPException(status_code=500, detail="Failed to create memory item.")
    
    new_item = item_res.data[0]
    new_item_id = new_item['id']

    # 2. Concurrently generate aids and review schedule
    aids_task = generate_memory_aids(item.content)
    schedule_task = asyncio.to_thread(generate_review_schedule_from_ebbinghaus)
    
    results = await asyncio.gather(aids_task, schedule_task, return_exceptions=True)
    aids_result, schedule_result = results

    if not isinstance(aids_result, Exception) and aids_result:
        supabase.table("memory_aids").insert({"memory_item_id": new_item_id, "user_id": user_id, "mind_map_data": json.dumps(aids_result.get("mindMap", {})), "mnemonics_data": json.dumps(aids_result.get("mnemonics", [])), "sensory_associations_data": json.dumps(aids_result.get("sensoryAssociations", []))}).execute()

    if not isinstance(schedule_result, Exception) and schedule_result:
        schedule_entries = [{"memory_item_id": new_item_id, "user_id": user_id, "review_date": date_str} for date_str in schedule_result.get("review_dates", [])]
        if schedule_entries:
            supabase.table("review_schedules").insert(schedule_entries).execute()

    return get_memory_item(item_id=new_item_id, current_user=current_user, supabase=supabase)

@app.get("/api/memory_items/{item_id}", response_model=schemas.MemoryItem)
def get_memory_item(item_id: uuid.UUID, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    # Step 1: Fetch the main memory item
    res = supabase.table("memory_items").select("*").eq("id", str(item_id)).eq("user_id", current_user['id']).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Memory item not found")
    
    item_data = res.data
    
    # Step 2: Fetch the related memory aids
    aids_res = supabase.table("memory_aids").select("*").eq("memory_item_id", str(item_id)).execute()
    
    if aids_res.data:
        aids_data = aids_res.data[0]
        item_data['memory_aids'] = {
            "mindMap": json.loads(aids_data.get('mind_map_data', '{}')),
            "mnemonics": json.loads(aids_data.get('mnemonics_data', '[]')),
            "sensoryAssociations": json.loads(aids_data.get('sensory_associations_data', '[]'))
        }
            
    return schemas.MemoryItem.model_validate(item_data)

@app.put("/api/memory_items/{item_id}", response_model=schemas.MemoryItem)
def update_memory_item(item_id: uuid.UUID, item_update: schemas.MemoryItemUpdate, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    update_data = item_update.model_dump(exclude_unset=True, exclude={'memory_aids'})
    
    # Manually serialize datetime objects to ISO 8601 strings
    if 'next_review_date' in update_data and isinstance(update_data['next_review_date'], datetime):
        update_data['next_review_date'] = update_data['next_review_date'].isoformat()
    if 'review_date' in update_data and isinstance(update_data['review_date'], datetime):
        update_data['review_date'] = update_data['review_date'].isoformat()

    if update_data:
        supabase.table("memory_items").update(update_data).eq("id", str(item_id)).eq("user_id", current_user['id']).execute()

    if item_update.memory_aids:
        aids_dict = item_update.memory_aids.model_dump()
        supabase.table("memory_aids").upsert({"memory_item_id": str(item_id), "user_id": current_user['id'], "mind_map_data": json.dumps(aids_dict.get("mindMap", {})), "mnemonics_data": json.dumps(aids_dict.get("mnemonics", [])), "sensory_associations_data": json.dumps(aids_dict.get("sensoryAssociations", []))}).execute()

    return get_memory_item(item_id=item_id, current_user=current_user, supabase=supabase)

@app.delete("/api/memory_items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory_item(item_id: uuid.UUID, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    supabase.table("memory_items").delete().eq("id", str(item_id)).eq("user_id", current_user['id']).execute()
    return None

# --- Review Routes ---
@app.get("/api/review_schedules", response_model=List[schemas.ReviewSchedule])
def get_review_schedules(memory_item_id: Optional[uuid.UUID] = None, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    query = supabase.table("review_schedules").select("*").eq("user_id", current_user['id'])
    if memory_item_id:
        query = query.eq("memory_item_id", str(memory_item_id))
    res = query.order("review_date").execute()
    return res.data

@app.post("/api/review_schedules/{schedule_id}/complete", response_model=schemas.MemoryItem)
def complete_review(schedule_id: uuid.UUID, review_data: schemas.ReviewCompletionRequest, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    # 1. Mark schedule as complete
    schedule_res = supabase.table("review_schedules").update({"completed": True}).eq("id", str(schedule_id)).eq("user_id", current_user['id']).execute()
    if not schedule_res.data:
        raise HTTPException(status_code=404, detail="Review schedule not found.")
    
    memory_item_id = schedule_res.data[0]['memory_item_id']

    # 2. Update the memory item's state
    # This is a simplified update. A more robust solution might use a DB function.
    item_res = supabase.table("memory_items").select("review_count").eq("id", memory_item_id).single().execute()
    new_review_count = item_res.data['review_count'] + 1
    
    # Simple logic for next review date based on mastery
    if review_data.mastery >= 90:
        next_review_delta = timedelta(days=30)
    elif review_data.mastery >= 70:
        next_review_delta = timedelta(days=14)
    else:
        next_review_delta = timedelta(days=3)

    update_data = {
        "mastery": review_data.mastery,
        "difficulty": review_data.difficulty,
        "review_count": new_review_count,
        "review_date": datetime.utcnow().isoformat(),
        "next_review_date": (datetime.utcnow() + next_review_delta).isoformat()
    }
    supabase.table("memory_items").update(update_data).eq("id", memory_item_id).execute()

    return get_memory_item(item_id=memory_item_id, current_user=current_user, supabase=supabase)

# --- Memory Aids Generation ---
@app.post("/api/memory/generate", response_model=schemas.MemoryAids)
async def generate_memory_aids_endpoint(request: schemas.MemoryGenerateRequest, current_user: dict = Depends(get_current_user)):
    raw_response = await generate_memory_aids(request.content)
    if not raw_response:
        raise HTTPException(status_code=500, detail="Failed to generate memory aids from AI service")
    return schemas.MemoryAids(**raw_response)

# --- Share Routes ---
@app.post("/api/share", response_model=schemas.ShareResponse)
def create_share(share_request: schemas.ShareCreate, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    # Get the memory item to ensure it belongs to the user
    memory_item = get_memory_item(item_id=share_request.memory_item_id, current_user=current_user, supabase=supabase)
    
    # Generate a unique share ID
    share_id = str(uuid.uuid4())
    
    # Prepare share content based on type
    share_content = {}
    if share_request.share_type == "mindmap":
        share_content = {
            "title": memory_item.title,
            "content": memory_item.memory_aids.mindMap.model_dump() if memory_item.memory_aids else {},
            "type": "mindmap"
        }
    elif share_request.share_type == "mnemonic":
        if memory_item.memory_aids and memory_item.memory_aids.mnemonics:
            # Find specific mnemonic by content_id or use first one
            mnemonic = None
            if share_request.content_id:
                mnemonic = next((m for m in memory_item.memory_aids.mnemonics if m.id == share_request.content_id), None)
            if not mnemonic and memory_item.memory_aids.mnemonics:
                mnemonic = memory_item.memory_aids.mnemonics[0]
            
            share_content = {
                "title": f"{memory_item.title} - {mnemonic.title}" if mnemonic else memory_item.title,
                "content": mnemonic.model_dump() if mnemonic else {},
                "type": "mnemonic"
            }
    elif share_request.share_type == "sensory":
        if memory_item.memory_aids and memory_item.memory_aids.sensoryAssociations:
            # Find specific sensory association by content_id or use first one
            sensory = None
            if share_request.content_id:
                sensory = next((s for s in memory_item.memory_aids.sensoryAssociations if s.id == share_request.content_id), None)
            if not sensory and memory_item.memory_aids.sensoryAssociations:
                sensory = memory_item.memory_aids.sensoryAssociations[0]
            
            share_content = {
                "title": f"{memory_item.title} - {sensory.title}" if sensory else memory_item.title,
                "content": sensory.model_dump() if sensory else {},
                "type": "sensory"
            }
    
    # Store share data in database
    share_data = {
        "id": share_id,
        "memory_item_id": str(share_request.memory_item_id),
        "user_id": current_user['id'],
        "share_type": share_request.share_type,
        "content_id": share_request.content_id,
        "share_content": json.dumps(share_content),
        "expires_at": share_request.expires_at.isoformat() if share_request.expires_at else None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    supabase.table("shares").insert(share_data).execute()
    
    # Generate share URL
    share_url = f"{settings.FRONTEND_URL}/share/{share_request.share_type}/{share_id}"
    
    return schemas.ShareResponse(share_id=share_id, share_url=share_url)

@app.get("/api/share/{share_id}", response_model=schemas.ShareData)
def get_share(share_id: str, supabase: Client = Depends(get_anon_supabase)):
    # Get share data from database
    res = supabase.table("shares").select("*").eq("id", share_id).single().execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Share not found")
    
    share_data = res.data
    
    # Check if share has expired
    if share_data.get('expires_at'):
        expires_at = datetime.fromisoformat(share_data['expires_at'])
        if datetime.utcnow() > expires_at:
            raise HTTPException(status_code=410, detail="Share has expired")
    
    # Parse share content
    share_content = json.loads(share_data['share_content'])
    
    return schemas.ShareData(
        id=share_data['id'],
        title=share_content.get('title', ''),
        content=share_content.get('content', {}),
        share_type=share_data['share_type'],
        created_at=datetime.fromisoformat(share_data['created_at']),
        expires_at=datetime.fromisoformat(share_data['expires_at']) if share_data.get('expires_at') else None
    )

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)