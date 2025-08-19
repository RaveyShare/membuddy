from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
import logging
import uuid
from typing import List, Optional
from datetime import datetime, timedelta

import schemas
from dependencies import get_current_user, get_supabase_authed
from routers.memory_items import get_memory_item

router = APIRouter(prefix="/api/review_schedules", tags=["reviews"])

@router.get("", response_model=List[schemas.ReviewSchedule])
def get_review_schedules(memory_item_id: Optional[uuid.UUID] = None, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    query = supabase.table("review_schedules").select("*").eq("user_id", current_user['id'])
    if memory_item_id:
        query = query.eq("memory_item_id", str(memory_item_id))
    res = query.order("review_date").execute()
    return res.data

@router.post("/{schedule_id}/complete", response_model=schemas.MemoryItem)
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