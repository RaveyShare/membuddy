from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import re
from supabase import Client, create_client
from gotrue.errors import AuthApiError
import jwt
import logging
import uuid

from config import settings
from database import get_anon_supabase
import schemas
from gemini import generate_memory_aids as generate_aids_from_gemini

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
    except Exception as e:
        logger.error(f"Credential validation error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

async def get_supabase_authed(current_user: dict = Depends(get_current_user)) -> Client:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    supabase.postgrest.auth(current_user['token'])
    return supabase

# --- API Routes ---

# --- Auth Routes ---
@app.post("/api/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, supabase: Client = Depends(get_anon_supabase)):
    try:
        res = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
            "options": {"data": {"full_name": user.full_name}}
        })
        if res.user:
            return schemas.User(id=res.user.id, email=res.user.email, full_name=res.user.user_metadata.get("full_name", ""))
        else:
            raise HTTPException(status_code=400, detail="Could not register user. Please check your email for confirmation.")
    except AuthApiError as e:
        raise HTTPException(status_code=e.status, detail=e.message)

@app.post("/api/auth/login")
def login(user: schemas.UserLogin, supabase: Client = Depends(get_anon_supabase)):
    logger.info(f"Login request received for user: {user.email}")
    try:
        res = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        access_token = jwt.encode(
            {
                "sub": str(res.user.id),
                "email": res.user.email,
                "full_name": res.user.user_metadata.get("full_name", ""),
                "exp": res.session.expires_at
            },
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256"
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except AuthApiError as e:
        logger.error(f"Supabase auth error for {user.email}: {e}")
        raise HTTPException(status_code=e.status, detail=e.message)
    except Exception as e:
        logger.error(f"An unexpected error occurred during login for {user.email}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

# --- Memory Aids Generation ---
class MemoryGenerateRequest(BaseModel):
    content: str

@app.post("/api/memory/generate", response_model=schemas.MemoryAids)
async def generate_memory_aids_endpoint(
    request: MemoryGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"User {current_user['id']} requested memory aids generation.")
    raw_response = await generate_aids_from_gemini(request.content)
    if not raw_response:
        raise HTTPException(status_code=500, detail="Failed to generate memory aids from AI service")

    response_data = {
        "mindMap": raw_response.get("mindMap", {}),
        "mnemonics": raw_response.get("mnemonics", []),
        "sensoryAssociations": raw_response.get("sensoryAssociations", [])
    }
    
    for mnemonic in response_data["mnemonics"]:
        if "type" not in mnemonic:
            mnemonic["type"] = "story"
            
    return schemas.MemoryAids(**response_data)

# --- Memory Item CRUD ---
@app.get("/api/memory_items", response_model=List[schemas.MemoryItem])
def get_memory_items(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    res = supabase.table("memory_items").select("*, memory_aids(*)").eq("user_id", current_user['id']).range(skip, skip + limit - 1).execute()
    
    for item in res.data:
        if item.get('memory_aids'):
            aids_data = item['memory_aids'][0] if item['memory_aids'] else None
            if aids_data:
                item['memory_aids'] = {
                    "mindMap": json.loads(aids_data.get('mind_map_data', '{}')),
                    "mnemonics": json.loads(aids_data.get('mnemonics_data', '[]')),
                    "sensoryAssociations": json.loads(aids_data.get('sensory_associations_data', '[]'))
                }
            else:
                item['memory_aids'] = None
        else:
            item['memory_aids'] = None
            
    return res.data

@app.post("/api/memory_items", response_model=schemas.MemoryItem)
def create_memory_item(
    item: schemas.MemoryItemCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    try:
        res = supabase.table("memory_items").insert({
            "title": item.content[:50],
            "content": item.content,
            "user_id": current_user['id']
        }, returning="representation").execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create memory item.")
        
        new_item = res.data[0]
        
        if item.memory_aids:
            aids_res = supabase.table("memory_aids").insert({
                "memory_item_id": new_item['id'],
                "user_id": current_user['id'],
                "mind_map_data": json.dumps(item.memory_aids.mindMap.dict()),
                "mnemonics_data": json.dumps([m.dict() for m in item.memory_aids.mnemonics]),
                "sensory_associations_data": json.dumps([s.dict() for s in item.memory_aids.sensoryAssociations])
            }).execute()
            
        return new_item
        
    except Exception as e:
        logger.error(f"Error creating memory item: {e}")
        raise HTTPException(status_code=422, detail=f"Could not process memory item data: {e}")

@app.get("/api/memory_items/{item_id}", response_model=schemas.MemoryItem)
def get_memory_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    res = supabase.table("memory_items").select("*, memory_aids(*)").eq("id", str(item_id)).eq("user_id", current_user['id']).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Memory item not found")
    
    item = res.data
    if item.get('memory_aids'):
        aids_data = item['memory_aids'][0] if item['memory_aids'] else None
        if aids_data:
            item['memory_aids'] = {
                "mindMap": json.loads(aids_data.get('mind_map_data', '{}')),
                "mnemonics": json.loads(aids_data.get('mnemonics_data', '[]')),
                "sensoryAssociations": json.loads(aids_data.get('sensory_associations_data', '[]'))
            }
        else:
            item['memory_aids'] = None
    else:
        item['memory_aids'] = None
        
    return item

@app.put("/api/memory_items/{item_id}", response_model=schemas.MemoryItem)
def update_memory_item(
    item_id: uuid.UUID,
    item: schemas.MemoryAidsUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    try:
        aids_res = supabase.table("memory_aids").insert({
            "memory_item_id": str(item_id),
            "user_id": current_user['id'],
            "mind_map_data": json.dumps(item.memory_aids.mindMap.dict()),
            "mnemonics_data": json.dumps([m.dict() for m in item.memory_aids.mnemonics]),
            "sensory_associations_data": json.dumps([s.dict() for s in item.memory_aids.sensoryAssociations])
        }).execute()

        item_res = supabase.table("memory_items").select("*, memory_aids(*)").eq("id", str(item_id)).single().execute()
        
        if not item_res.data:
            raise HTTPException(status_code=404, detail="Memory item not found after updating aids.")
        
        updated_item = item_res.data
        if updated_item.get('memory_aids'):
            aids_data = updated_item['memory_aids'][0] if updated_item['memory_aids'] else None
            if aids_data:
                updated_item['memory_aids'] = {
                    "mindMap": json.loads(aids_data.get('mind_map_data', '{}')),
                    "mnemonics": json.loads(aids_data.get('mnemonics_data', '[]')),
                    "sensoryAssociations": json.loads(aids_data.get('sensory_associations_data', '[]'))
                }
            else:
                updated_item['memory_aids'] = None
        else:
            updated_item['memory_aids'] = None
            
        return updated_item
        
    except Exception as e:
        logger.error(f"Error updating memory item aids: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while updating memory aids: {e}")

@app.delete("/api/memory_items/{item_id}")
def delete_memory_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    res = supabase.table("memory_items").delete().eq("id", str(item_id)).eq("user_id", current_user['id']).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Memory item not found")
    return {"status": "success", "message": "Memory item deleted successfully."}

# --- Review Schedule Routes ---
@app.post("/api/review/schedule", response_model=schemas.ReviewSchedule)
def schedule_review(
    review: schemas.ReviewScheduleCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    res = supabase.table("memory_items").select("id").eq("id", str(review.memory_item_id)).eq("user_id", current_user['id']).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Memory item not found")
    
    res = supabase.table("review_schedules").insert({
        "memory_item_id": str(review.memory_item_id),
        "user_id": current_user['id'],
        "review_date": review.review_date.isoformat(),
        "completed": review.completed
    }).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to schedule review.")
    return res.data[0]

@app.get("/api/review/schedule", response_model=List[schemas.ReviewSchedule])
def get_review_schedule(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    res = supabase.table("review_schedules").select("*").eq("user_id", current_user['id']).execute()
    return res.data

# --- Review Schedule Generation ---
class ReviewGenerateRequest(BaseModel):
    memory_item_id: uuid.UUID

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)