from fastapi import APIRouter, Depends, HTTPException
from typing import List
from db.sql.schemas import MessageCreate, MessageResponse
from db.sql.models import Message, Chat
from utils.security import get_current_user
from db.sql.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(tags=["messages"], prefix="/chats/{chat_id}/messages")

@router.post("/", response_model=MessageResponse)
async def create_message(
    chat_id: int,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea un nuevo mensaje en el chat especificado."""
    
    # Verificar que el chat pertenece al usuario actual
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    new_message = Message(
        chat_id=chat_id,
        user_id=current_user.id,
        content=message.content,
        sender=message.sender
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

@router.get("/", response_model=List[MessageResponse])
async def get_chat_messages(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene todos los mensajes de un chat específico."""
    
    # Verificar que el chat pertenece al usuario actual
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = db.query(Message).filter(Message.chat_id == chat_id).all()
    return messages
