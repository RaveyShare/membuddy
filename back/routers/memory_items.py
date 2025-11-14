from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
import logging
import asyncio
import json
import uuid
from typing import List, Optional
from datetime import datetime, timedelta

import schemas
from dependencies import get_current_user
from ai_manager import AIManager
from mock_store import memory_items as store_items, create_memory_item

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/memory_items", tags=["memory_items"])

@router.get("", response_model=List[schemas.MemoryItem])
def get_memory_items(skip: int = 0, limit: int = 100, current_user: dict = Depends(get_current_user)):
    items = [i for i in store_items.values() if i["user_id"] == current_user["id"]]
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return [schemas.MemoryItem.model_validate(i) for i in items[skip:skip+limit]]

@router.post("", response_model=schemas.MemoryItem, status_code=status.HTTP_201_CREATED)
async def create_memory_item_endpoint(item: schemas.MemoryItemCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user['id']
    logger.info(f"Creating memory item for user {user_id}")
    
    try:
        # 1. Create the main memory item
        item_dict = item.model_dump(exclude_unset=True)
        item_dict['user_id'] = user_id
        new_item = create_memory_item(user_id, item_dict)
        new_item_id = new_item['id']

        # 2. Concurrently generate aids and review schedule
        ai_manager = AIManager()
        
        # Create tasks properly - generate_memory_aids is sync, so wrap it in asyncio.to_thread
        aids_task = asyncio.to_thread(ai_manager.generate_memory_aids, item.content)
        schedule_task = asyncio.to_thread(ai_manager.generate_review_schedule_from_ebbinghaus)
        
        results = await asyncio.gather(aids_task, schedule_task, return_exceptions=True)
        aids_result, schedule_result = results

        # Handle memory aids generation
        if isinstance(aids_result, Exception):
            logger.error(f"Failed to generate memory aids: {aids_result}")
        elif aids_result:
            try:
                store_items[new_item_id]["memory_aids"] = {
                    "mindMap": aids_result.get("mindMap", None),
                    "mnemonics": aids_result.get("mnemonics", []),
                    "sensoryAssociations": aids_result.get("sensoryAssociations", []),
                }
            except Exception as e:
                logger.error(f"Failed to save memory aids: {e}")

        # Handle review schedule generation
        if isinstance(schedule_result, Exception):
            logger.error(f"Failed to generate review schedule: {schedule_result}")
        elif schedule_result:
            try:
                pass
            except Exception as e:
                logger.error(f"Failed to save review schedule: {e}")

        return get_memory_item(item_id=uuid.UUID(new_item_id), current_user=current_user)
    
    except Exception as e:
        logger.error(f"Error creating memory item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create memory item")

@router.get("/{item_id}", response_model=schemas.MemoryItem)
def get_memory_item(item_id: uuid.UUID, current_user: dict = Depends(get_current_user)):
    i = store_items.get(str(item_id))
    if not i or i["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Memory item not found")
    return schemas.MemoryItem.model_validate(i)

@router.put("/{item_id}", response_model=schemas.MemoryItem)
def update_memory_item(item_id: uuid.UUID, item_update: schemas.MemoryItemUpdate, current_user: dict = Depends(get_current_user)):
    update_data = item_update.model_dump(exclude_unset=True, exclude={'memory_aids'})
    
    # Manually serialize datetime objects to ISO 8601 strings
    if 'next_review_date' in update_data and isinstance(update_data['next_review_date'], datetime):
        update_data['next_review_date'] = update_data['next_review_date'].isoformat()
    if 'review_date' in update_data and isinstance(update_data['review_date'], datetime):
        update_data['review_date'] = update_data['review_date'].isoformat()

    if update_data:
        i = store_items.get(str(item_id))
        if not i or i["user_id"] != current_user["id"]:
            raise HTTPException(status_code=404, detail="Memory item not found")
        for k, v in update_data.items():
            i[k] = v
        i["updated_at"] = datetime.utcnow().isoformat()

    if item_update.memory_aids:
        aids_dict = item_update.memory_aids.model_dump()
        i = store_items.get(str(item_id))
        i["memory_aids"] = {
            "mindMap": aids_dict.get("mindMap", None),
            "mnemonics": aids_dict.get("mnemonics", []),
            "sensoryAssociations": aids_dict.get("sensoryAssociations", []),
        }

    return get_memory_item(item_id=item_id, current_user=current_user)

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory_item(item_id: uuid.UUID, current_user: dict = Depends(get_current_user)):
    i = store_items.get(str(item_id))
    if not i or i["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Memory item not found")
    del store_items[str(item_id)]
    return None