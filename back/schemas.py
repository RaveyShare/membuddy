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

# --- WeChat Login Schemas ---
class WechatMiniLoginRequest(BaseModel):
    code: str
    encrypted_data: Optional[str] = None
    iv: Optional[str] = None

class WechatMpLoginRequest(BaseModel):
    code: str
    state: str

class WechatUserInfo(BaseModel):
    openid: str
    unionid: Optional[str] = None
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    gender: Optional[int] = None
    city: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None

class User(UserBase):
    id: uuid.UUID
    wechat_openid: Optional[str] = None
    wechat_unionid: Optional[str] = None
    wechat_nickname: Optional[str] = None
    wechat_avatar: Optional[str] = None
    class Config:
        from_attributes = True

# --- Memory Aids Schemas ---
class MindMapNode(BaseModel):
    id: str
    label: str
    children: Optional[List['MindMapNode']] = None

MindMapNode.model_rebuild()

class KeyPrinciple(BaseModel):
    concept: str
    example: str

class MemoryScene(BaseModel):
    principle: str
    scene: str
    anchor: str

class Mnemonic(BaseModel):
    id: str
    title: str
    content: str
    type: str
    explanation: Optional[str] = None
    corePoint: Optional[str] = None
    keyPrinciples: Optional[List[KeyPrinciple]] = None
    theme: Optional[str] = None
    scenes: Optional[List[MemoryScene]] = None

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
    content: Union[List[VisualAssociation], List[AuditoryAssociation], List[TactileAssociation], str]

class MemoryAids(BaseModel):
    mindMap: Optional[MindMapNode] = None
    mnemonics: List[Mnemonic] = []
    sensoryAssociations: List[SensoryAssociation] = []

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

class ResetPasswordPayload(BaseModel):
    password: str

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

# --- Media Generation Schemas ---
class ImageGenerateRequest(BaseModel):
    content: str
    context: Optional[str] = ""

class AudioGenerateRequest(BaseModel):
    content: str
    context: Optional[str] = ""

class ImageGenerateResponse(BaseModel):
    prompt: str

# --- WeChat Web App Login Schemas ---
class WechatWebLoginRequest(BaseModel):
    code: str
    state: str

class WechatQrCodeRequest(BaseModel):
    redirect_uri: Optional[str] = None

class WechatQrCodeResponse(BaseModel):
    auth_url: str
    state: str
    message: Optional[str] = None
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    status: str = "prompt_generated"

class AudioGenerateResponse(BaseModel):
    script: str
    suggestions: Optional[str] = None
    audio_base64: Optional[str] = None
    duration: Optional[float] = None
    sound_description: Optional[str] = None
    sound_type: Optional[str] = None
    message: Optional[str] = None
    status: str = "prompt_generated"
    voice: Optional[str] = None

