from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Union
from datetime import datetime
import uuid

# User schemas
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

# Memory item schemas
class MemoryItemBase(BaseModel):
    content: str

class MemoryItemCreate(MemoryItemBase):
    memory_aids: Optional[MemoryAids] = None

class MemoryItem(MemoryItemBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    title: str
    content: str
    memory_aids: Optional[MemoryAids] = None
    tags: List[str] = ['default']
    category: str = 'default'
    difficulty: str = 'medium'
    mastery: int = 50
    reviewCount: int = 0
    starred: bool = False
    next_review_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# Review schedule schemas
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

class MemoryAidsUpdate(BaseModel):
    memory_aids: MemoryAids


class MemoryAidsUpdate(BaseModel):
    memory_aids: MemoryAids
# --- Memory Aids Generation ---
class MemoryGenerateRequest(BaseModel):
    content: str
