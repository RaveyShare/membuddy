from fastapi import APIRouter, HTTPException, Depends
import logging
import uuid
from typing import List, Optional
from datetime import datetime, timedelta

import schemas
from dependencies import get_current_user
from mock_store import review_schedules as store_schedules, memory_items as store_items

router = APIRouter(prefix="/api/review_schedules", tags=["reviews"])

@router.get("", response_model=List[schemas.ReviewSchedule])
def get_review_schedules(memory_item_id: Optional[uuid.UUID] = None, current_user: dict = Depends(get_current_user)):
    res = [s for s in store_schedules.values() if s["user_id"] == current_user["id"]]
    if memory_item_id:
        res = [s for s in res if s["memory_item_id"] == str(memory_item_id)]
    res.sort(key=lambda x: x["review_date"])
    return [schemas.ReviewSchedule.model_validate({**s, "created_at": datetime.fromisoformat(s["created_at"]), "review_date": datetime.fromisoformat(s["review_date"])}) for s in res]

@router.post("/{schedule_id}/complete", response_model=schemas.MemoryItem)
def complete_review(schedule_id: uuid.UUID, review_data: schemas.ReviewCompletionRequest, current_user: dict = Depends(get_current_user)):
    s = store_schedules.get(str(schedule_id))
    if not s or s["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Review schedule not found.")
    s["completed"] = True
    memory_item_id = s['memory_item_id']
    i = store_items.get(memory_item_id)
    if not i or i["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Memory item not found")
    new_review_count = int(i.get('review_count', 0)) + 1
    if review_data.mastery >= 90:
        next_review_delta = timedelta(days=30)
    elif review_data.mastery >= 70:
        next_review_delta = timedelta(days=14)
    else:
        next_review_delta = timedelta(days=3)
    i.update({
        "mastery": review_data.mastery,
        "difficulty": review_data.difficulty,
        "review_count": new_review_count,
        "review_date": datetime.utcnow().isoformat(),
        "next_review_date": (datetime.utcnow() + next_review_delta).isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    })
    return schemas.MemoryItem.model_validate(i)
