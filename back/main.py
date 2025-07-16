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
import asyncio

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
        
        # Return the whole token so we can use it for authenticated Supabase requests
        return {"id": user_id, "email": payload.get("email"), "full_name": payload.get("full_name", ""), "token": token}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception as e:
        logger.error(f"Credential validation error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

def get_supabase_authed(current_user: dict = Depends(get_current_user)) -> Client:
    """Get an authenticated Supabase client for the current user."""
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    # The official library uses the Authorization header directly.
    # We pass the user's JWT to the client instance.
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
            # This path is often taken if the user already exists but is not confirmed.
            raise HTTPException(status_code=400, detail="Could not register user. If you have already signed up, please check your email for a confirmation link.")
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
@app.post("/api/memory/generate", response_model=schemas.MemoryAids)
async def generate_memory_aids_endpoint(
    request: schemas.MemoryGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"User {current_user['id']} requested memory aids generation.")
    raw_response = await generate_memory_aids(request.content)
    if not raw_response:
        raise HTTPException(status_code=500, detail="Failed to generate memory aids from AI service")
    
    return schemas.MemoryAids(**raw_response)

# --- Memory Item CRUD ---
@app.get("/api/memory_items", response_model=List[schemas.MemoryItem])
def get_memory_items(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    # Fetch items with their related review schedules
    res = supabase.table("memory_items").select("*, memory_aids(*), review_schedules(review_date, completed)").eq("user_id", current_user['id']).order("created_at", desc=True).range(skip, skip + limit - 1).execute()
    
    items = []
    for item_data in res.data:
        # Find the next upcoming review date
        next_review = None
        if item_data.get("review_schedules"):
            upcoming_reviews = [
                r for r in item_data["review_schedules"] 
                if not r['completed'] and r.get('review_date')
            ]
            if upcoming_reviews:
                # Sort by review_date to find the earliest
                upcoming_reviews.sort(key=lambda r: r['review_date'])
                next_review = upcoming_reviews[0]['review_date']
        
        item_data['next_review_date'] = next_review

        # Handle memory aids parsing
        if item_data.get('memory_aids'):
            aids_list = item_data['memory_aids']
            if aids_list:
                aids_data = aids_list[0]
                item_data['memory_aids'] = {
                    "mindMap": json.loads(aids_data.get('mind_map_data', '{}')),
                    "mnemonics": json.loads(aids_data.get('mnemonics_data', '[]')),
                    "sensoryAssociations": json.loads(aids_data.get('sensory_associations_data', '[]'))
                }
            else:
                item_data['memory_aids'] = None
        
        # Validate with the Pydantic model, which will apply defaults
        items.append(schemas.MemoryItem.model_validate(item_data))
            
    return items

@app.post("/api/memory_items", response_model=schemas.MemoryItem, status_code=status.HTTP_201_CREATED)
async def create_memory_item(
    item: schemas.MemoryItemCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    user_id = current_user['id']
    
    # 1. Create the main memory item
    try:
        item_res = supabase.table("memory_items").insert({
            "title": item.content[:50],
            "content": item.content,
            "user_id": user_id
        }, returning="representation").execute()
        
        if not item_res.data:
            raise HTTPException(status_code=500, detail="Failed to create memory item.")
        
        new_item = item_res.data[0]
        new_item_id = new_item['id']
        
    except Exception as e:
        logger.error(f"Error creating memory item in DB: {e}")
        raise HTTPException(status_code=500, detail=f"Database error while creating memory item: {e}")

    # 2. Concurrently generate aids and review schedule
    try:
        aids_task = generate_memory_aids(item.content)
        schedule_task = asyncio.to_thread(generate_review_schedule_from_ebbinghaus) # Run sync function in thread
        
        results = await asyncio.gather(aids_task, schedule_task, return_exceptions=True)
        
        aids_result, schedule_result = results

        # Handle aids result
        if isinstance(aids_result, Exception) or not aids_result:
            logger.error(f"Failed to generate memory aids: {aids_result}")
            # We can proceed without aids, the item is already created
        else:
            supabase.table("memory_aids").insert({
                "memory_item_id": new_item_id,
                "user_id": user_id,
                "mind_map_data": json.dumps(aids_result.get("mindMap", {})),
                "mnemonics_data": json.dumps(aids_result.get("mnemonics", [])),
                "sensory_associations_data": json.dumps(aids_result.get("sensoryAssociations", []))
            }).execute()

        # Handle schedule result
        if isinstance(schedule_result, Exception) or not schedule_result:
            logger.error(f"Failed to generate review schedule: {schedule_result}")
        else:
            review_dates = schedule_result.get("review_dates", [])
            schedule_entries = [
                {
                    "memory_item_id": new_item_id,
                    "user_id": user_id,
                    "review_date": date_str,
                    "completed": False
                }
                for date_str in review_dates
            ]
            if schedule_entries:
                supabase.table("review_schedules").insert(schedule_entries).execute()

    except Exception as e:
        logger.error(f"Error during post-creation tasks (aids/schedule): {e}")
        # The main item is created, but aids/schedule failed. 
        # The API can still return the created item.
        
    # 3. Fetch the final item state to return
    final_item = get_memory_item(item_id=new_item_id, current_user=current_user, supabase=supabase)
    return final_item


@app.get("/api/memory_items/{item_id}", response_model=schemas.MemoryItem)
def get_memory_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    res = supabase.table("memory_items").select("*, memory_aids(*), review_schedules(review_date, completed)").eq("id", str(item_id)).eq("user_id", current_user['id']).single().execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Memory item not found")
    
    item_data = res.data

    # Find the next upcoming review date
    next_review = None
    if item_data.get("review_schedules"):
        upcoming_reviews = [
            r for r in item_data["review_schedules"] 
            if not r['completed'] and r.get('review_date')
        ]
        if upcoming_reviews:
            upcoming_reviews.sort(key=lambda r: r['review_date'])
            next_review = upcoming_reviews[0]['review_date']
    
    item_data['next_review_date'] = next_review

    # Handle memory aids parsing
    if item_data.get('memory_aids'):
        aids_list = item_data['memory_aids']
        if aids_list:
            aids_data = aids_list[0]
            item_data['memory_aids'] = {
                "mindMap": json.loads(aids_data.get('mind_map_data', '{}')),
                "mnemonics": json.loads(aids_data.get('mnemonics_data', '[]')),
                "sensoryAssociations": json.loads(aids_data.get('sensory_associations_data', '[]'))
            }
        else:
            item_data['memory_aids'] = None
            
    # Validate with the Pydantic model, which will apply defaults
    return schemas.MemoryItem.model_validate(item_data)

@app.put("/api/memory_items/{item_id}", response_model=schemas.MemoryItem)
def update_memory_item_aids(
    item_id: uuid.UUID,
    item_update: schemas.MemoryAidsUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    try:
        # Use upsert to either create or update the memory aids
        supabase.table("memory_aids").upsert({
            "memory_item_id": str(item_id),
            "user_id": current_user['id'],
            "mind_map_data": json.dumps(item_update.memory_aids.mindMap.dict()),
            "mnemonics_data": json.dumps([m.dict() for m in item_update.memory_aids.mnemonics]),
            "sensory_associations_data": json.dumps([s.dict() for s in item_update.memory_aids.sensoryAssociations])
        }).execute()

        # Fetch and return the updated memory item
        return get_memory_item(item_id=item_id, current_user=current_user, supabase=supabase)
        
    except Exception as e:
        logger.error(f"Error updating memory item aids: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while updating memory aids: {e}")

@app.delete("/api/memory_items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    # The related memory_aids and review_schedules will be deleted automatically 
    # by the CASCADE constraint in the database.
    res = supabase.table("memory_items").delete().eq("id", str(item_id)).eq("user_id", current_user['id']).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Memory item not found or you do not have permission to delete it.")
    
    return None

# --- Review Schedule Routes ---
@app.get("/api/review/schedule", response_model=List[schemas.ReviewSchedule])
def get_review_schedule(
    current_user: dict = Depends(get_current_user),
    supabase: Client = Depends(get_supabase_authed)
):
    """Get all review schedules for the current user."""
    res = supabase.table("review_schedules").select("*").eq("user_id", current_user['id']).order("review_date").execute()
    return res.data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
