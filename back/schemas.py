from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
from datetime import datetime
import uuid

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: uuid.UUID
    class Config:
        from_attributes = True

# --- Memory Aids Schemas ---
class MindMapNode(BaseModel):
    id: str
    label: str
    children: Optional[List['MindMapNode']] = None

MindMapNode.model_rebuild()

class Mnemonic(BaseModel):
    id: str
    title: str
    content: str
    type: str
    explanation: Optional[str] = None

class VisualAssociation(BaseModel):
    dynasty: str
    image: str
    color: str
    association: str

class AuditoryAssociation(BaseModel):
    dynasty: str
    sound: str
    rhythm: str

class TactileAssociation(BaseModel):
    dynasty: str
    texture: str
    feeling: str

class SensoryAssociation(BaseModel):
    id: str
    title: str
    type: str
    content: Union[List[VisualAssociation], List[AuditoryAssociation], List[TactileAssociation]]

class MemoryAids(BaseModel):
    mindMap: MindMapNode
    mnemonics: List[Mnemonic]
    sensoryAssociations: List[SensoryAssociation]

# --- Review Schedule Schemas ---
class ReviewScheduleBase(BaseModel):
    memory_item_id: uuid.UUID
    review_date: datetime
    completed: bool = False

class ReviewScheduleCreate(ReviewScheduleBase):
    pass

class ReviewSchedule(ReviewScheduleBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    class Config:
        from_attributes = True

# --- Memory Item Schemas ---
class MemoryItemBase(BaseModel):
    content: str
    title: Optional[str] = None
    category: Optional[str] = '其他'
    tags: Optional[List[str]] = []
    type: Optional[str] = 'general'
    difficulty: Optional[str] = 'medium'
    mastery: Optional[int] = 0
    review_count: Optional[int] = 0
    review_date: Optional[datetime] = None
    next_review_date: Optional[datetime] = None
    starred: Optional[bool] = False

class MemoryItemCreate(MemoryItemBase):
    memory_aids: Optional[MemoryAids] = None

class MemoryItem(MemoryItemBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    memory_aids: Optional[MemoryAids] = None
    class Config:
        from_attributes = True

class MemoryItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    starred: Optional[bool] = None
    difficulty: Optional[str] = None
    mastery: Optional[int] = None
    review_count: Optional[int] = None
    review_date: Optional[datetime] = None
    next_review_date: Optional[datetime] = None
    memory_aids: Optional[MemoryAids] = None

# --- API Request/Response Schemas ---
class MemoryGenerateRequest(BaseModel):
    content: str

class ReviewCompletionRequest(BaseModel):
    mastery: int
    difficulty: str

class ForgotPasswordPayload(BaseModel):
    email: EmailStr

# --- Share Schemas ---
class ShareCreate(BaseModel):
    memory_item_id: uuid.UUID
    share_type: str  # 'mindmap', 'mnemonic', 'sensory'
    content_id: Optional[str] = None  # For specific mnemonic or sensory association
    expires_at: Optional[datetime] = None

class ShareData(BaseModel):
    id: str
    title: str
    content: dict
    share_type: str
    created_at: datetime
    expires_at: Optional[datetime] = None

class ShareResponse(BaseModel):
    share_id: str
    share_url: str

