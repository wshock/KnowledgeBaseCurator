from fastapi import APIRouter, Depends, HTTPException
from typing import List
from db.sql.schemas import ChatCreate, ChatResponse
from db.sql.models import Chat, Message
from utils.security import get_current_user
from db.sql.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(tags=["chats"], prefix="/chats")

@router.post("/", response_model=ChatResponse)
async def create_chat(
    chat: ChatCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Crea un nuevo chat para el usuario autenticado."""
    
    new_chat = Chat(
        user_id=current_user.id,
        title=chat.title
    )
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

@router.get("/", response_model=List[ChatResponse])
async def get_user_chats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene todos los chats del usuario autenticado."""
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).all()
    return chats

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtiene un chat específico si pertenece al usuario autenticado."""
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return chat

@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: int,
    chat_update: ChatCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualiza el título de un chat."""
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    chat.title = chat_update.title
    db.commit()
    db.refresh(chat)
    return chat

@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Elimina un chat y todos sus mensajes."""
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.query(Message).filter(Message.chat_id == chat_id).delete(synchronize_session=False)
    db.delete(chat)
    db.commit()
    return {"message": "Chat deleted successfully"}
