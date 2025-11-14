from fastapi import APIRouter, HTTPException, Depends
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional

import schemas
from dependencies import get_current_user
from config import settings
from mock_store import shares as store_shares, memory_items as store_items
import json

router = APIRouter(prefix="/api/share", tags=["sharing"])

@router.post("", response_model=schemas.ShareResponse)
def create_share(share_request: schemas.ShareCreate, current_user: dict = Depends(get_current_user)):
    i = store_items.get(str(share_request.memory_item_id))
    if not i or i["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Memory item not found")
    
    # Generate a unique share ID
    share_id = str(uuid.uuid4())
    
    # Prepare share content based on type
    share_content = {}
    if share_request.share_type == "mindmap":
        mm = (i.get("memory_aids") or {}).get("mindMap") or {}
        share_content = {"title": i.get("title", ""), "content": mm, "type": "mindmap"}
    elif share_request.share_type == "mnemonic":
        mns = (i.get("memory_aids") or {}).get("mnemonics") or []
        mn = None
        if share_request.content_id:
            mn = next((m for m in mns if m.get("id") == share_request.content_id), None)
        if not mn and mns:
            mn = mns[0]
        share_content = {"title": f"{i.get('title','')} - {mn.get('title','')}" if mn else i.get('title',''), "content": mn or {}, "type": "mnemonic"}
    elif share_request.share_type == "sensory":
        sens = (i.get("memory_aids") or {}).get("sensoryAssociations") or []
        s = None
        if share_request.content_id:
            s = next((x for x in sens if x.get("id") == share_request.content_id), None)
        if not s and sens:
            s = sens[0]
        share_content = {"title": f"{i.get('title','')} - {s.get('title','')}" if s else i.get('title',''), "content": s or {}, "type": "sensory"}
    
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
    
    store_shares[share_id] = share_data
    
    # Generate share URL
    share_url = f"{settings.FRONTEND_URL}/share/{share_request.share_type}/{share_id}"
    
    return schemas.ShareResponse(share_id=share_id, share_url=share_url)

@router.get("/{share_id}", response_model=schemas.ShareData)
def get_share(share_id: str):
    share_data = store_shares.get(share_id)
    if not share_data:
        raise HTTPException(status_code=404, detail="Share not found")
    
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
