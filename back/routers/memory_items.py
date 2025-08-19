from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from supabase import Client
import logging
import asyncio
import json
import uuid
from typing import List, Optional
from datetime import datetime, timedelta

import schemas
from dependencies import get_current_user, get_supabase_authed
from ai_manager import AIManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/memory_items", tags=["memory_items"])

@router.get("", response_model=List[schemas.MemoryItem])
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
                mind_map_data = json.loads(aid_data.get('mind_map_data', '{}'))
                # Convert empty or invalid mindMap object to None
                if mind_map_data == {} or not isinstance(mind_map_data, dict) or not mind_map_data.get('id') or not mind_map_data.get('label'):
                    mind_map_data = None
                
                # Handle mnemonics data conversion
                mnemonics_data = json.loads(aid_data.get('mnemonics_data', '[]'))
                converted_mnemonics = []
                for i, item in enumerate(mnemonics_data):
                    if isinstance(item, dict):
                        # Convert old format to new format
                        if 'technique' in item and 'content' in item:
                            converted_item = {
                                "id": str(i),
                                "title": item.get('technique', ''),
                                "content": item.get('content', ''),
                                "type": "mnemonic",
                                "explanation": item.get('explanation', '')
                            }
                            converted_mnemonics.append(converted_item)
                        else:
                            # Already in new format or has required fields
                            if 'id' in item and 'title' in item and 'content' in item and 'type' in item:
                                converted_mnemonics.append(item)
                
                # Handle sensoryAssociations data conversion
                sensory_data = json.loads(aid_data.get('sensory_associations_data', '[]'))
                converted_sensory = []
                for i, item in enumerate(sensory_data):
                    if isinstance(item, dict):
                        # Convert old format to new format
                        if 'sense' in item and 'desc' in item:
                            converted_item = {
                                "id": str(i),
                                "title": item.get('sense', ''),
                                "type": item.get('sense', '').lower(),
                                "content": [{
                                    "dynasty": "",
                                    "association": item.get('desc', ''),
                                    "image": "",
                                    "color": "",
                                    "sound": "",
                                    "rhythm": "",
                                    "texture": "",
                                    "feeling": ""
                                }]
                            }
                            converted_sensory.append(converted_item)
                        else:
                            # Already in new format or has required fields
                            if 'id' in item and 'title' in item and 'type' in item and 'content' in item:
                                converted_sensory.append(item)
                    
                items_map[item_id]['memory_aids'] = {
                    "mindMap": mind_map_data,
                    "mnemonics": converted_mnemonics,
                    "sensoryAssociations": converted_sensory
                }

    # Step 3: Validate and return the combined data
    final_items = [schemas.MemoryItem.model_validate(item) for item in items_map.values()]
    return final_items

@router.post("", response_model=schemas.MemoryItem, status_code=status.HTTP_201_CREATED)
async def create_memory_item(item: schemas.MemoryItemCreate, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    user_id = current_user['id']
    logger.info(f"Creating memory item for user {user_id}")
    
    try:
        # 1. Create the main memory item
        item_dict = item.model_dump(exclude_unset=True, exclude={'memory_aids'})
        item_dict['user_id'] = user_id
        if 'title' not in item_dict or not item_dict['title']:
            item_dict['title'] = item.content[:50]

        item_res = supabase.table("memory_items").insert(item_dict, returning="representation").execute()
        if not item_res.data:
            logger.error("Failed to create memory item")
            raise HTTPException(status_code=500, detail="Failed to create memory item.")
        
        new_item = item_res.data[0]
        new_item_id = new_item['id']
        logger.info(f"Memory item created with ID: {new_item_id}")

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
                supabase.table("memory_aids").insert({
                    "memory_item_id": new_item_id, 
                    "user_id": user_id, 
                    "mind_map_data": json.dumps(aids_result.get("mindMap", {})), 
                    "mnemonics_data": json.dumps(aids_result.get("mnemonics", [])), 
                    "sensory_associations_data": json.dumps(aids_result.get("sensoryAssociations", []))
                }).execute()
                logger.info(f"Memory aids generated for item {new_item_id}")
            except Exception as e:
                logger.error(f"Failed to save memory aids: {e}")

        # Handle review schedule generation
        if isinstance(schedule_result, Exception):
            logger.error(f"Failed to generate review schedule: {schedule_result}")
        elif schedule_result:
            try:
                schedule_entries = [{"memory_item_id": new_item_id, "user_id": user_id, "review_date": date_str} for date_str in schedule_result.get("review_dates", [])]
                if schedule_entries:
                    supabase.table("review_schedules").insert(schedule_entries).execute()
                    logger.info(f"Review schedule created for item {new_item_id}")
            except Exception as e:
                logger.error(f"Failed to save review schedule: {e}")

        return get_memory_item(item_id=new_item_id, current_user=current_user, supabase=supabase)
    
    except Exception as e:
        logger.error(f"Error creating memory item: {e}")
        raise HTTPException(status_code=500, detail="Failed to create memory item")

@router.get("/{item_id}", response_model=schemas.MemoryItem)
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
        
        # Handle mindMap data conversion
        mind_map_data = json.loads(aids_data.get('mind_map_data', '{}'))
        if mind_map_data == {}:
            mind_map_data = None
        
        # Handle mnemonics data conversion
        mnemonics_data = json.loads(aids_data.get('mnemonics_data', '[]'))
        converted_mnemonics = []
        for i, item in enumerate(mnemonics_data):
            if isinstance(item, dict):
                if 'technique' in item and 'content' in item:
                    converted_item = {
                        "id": str(i),
                        "title": item.get('technique', ''),
                        "content": item.get('content', ''),
                        "type": "mnemonic",
                        "explanation": item.get('explanation', '')
                    }
                    converted_mnemonics.append(converted_item)
                else:
                    if 'id' in item and 'title' in item and 'content' in item and 'type' in item:
                        converted_mnemonics.append(item)
        
        # Handle sensoryAssociations data conversion
        sensory_data = json.loads(aids_data.get('sensory_associations_data', '[]'))
        converted_sensory = []
        for i, item in enumerate(sensory_data):
            if isinstance(item, dict):
                if 'sense' in item and 'desc' in item:
                    converted_item = {
                        "id": str(i),
                        "title": item.get('sense', ''),
                        "type": item.get('sense', '').lower(),
                        "content": [{
                            "dynasty": "",
                            "association": item.get('desc', ''),
                            "image": "",
                            "color": "",
                            "sound": "",
                            "rhythm": "",
                            "texture": "",
                            "feeling": ""
                        }]
                    }
                    converted_sensory.append(converted_item)
                else:
                    if 'id' in item and 'title' in item and 'type' in item and 'content' in item:
                        converted_sensory.append(item)
        
        item_data['memory_aids'] = {
            "mindMap": mind_map_data,
            "mnemonics": converted_mnemonics,
            "sensoryAssociations": converted_sensory
        }
            
    return schemas.MemoryItem.model_validate(item_data)

@router.put("/{item_id}", response_model=schemas.MemoryItem)
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

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory_item(item_id: uuid.UUID, current_user: dict = Depends(get_current_user), supabase: Client = Depends(get_supabase_authed)):
    supabase.table("memory_items").delete().eq("id", str(item_id)).eq("user_id", current_user['id']).execute()
    return None