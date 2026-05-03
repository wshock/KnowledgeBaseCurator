from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)

class ChatCreate(BaseModel):
    title: str = Field(..., min_length=1)
    
class ChatResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    sender: str = Field(..., pattern="^(user|system|assistant)$")
    
class MessageResponse(BaseModel):
    id: int
    chat_id: int
    user_id: int
    content: str
    timestamp: datetime
    sender: str
    
    class Config:
        from_attributes = True