from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

import schemas
from dependencies import get_current_user, get_supabase_authed
from database import get_anon_supabase
from config import settings
from routers.memory_items import get_memory_item

router = APIRouter(prefix="/api/share", tags=["sharing"])

@router.post("", response_model=schemas.ShareResponse)
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

@router.get("/{share_id}", response_model=schemas.ShareData)
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