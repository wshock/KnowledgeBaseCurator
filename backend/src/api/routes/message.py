from fastapi import APIRouter, Depends, HTTPException
from typing import List
from db.sql.schemas import MessageCreate, MessageResponse, MessagePairResponse
from db.sql.models import Message, Chat
from utils.security import get_current_user
from db.sql.database import get_db
from sqlalchemy.orm import Session
from rag.graph import rag_chain


router = APIRouter(tags=["messages"], prefix="/chats/{chat_id}/messages")

@router.post("/", response_model=MessagePairResponse)
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
    
    user_message = Message(
        chat_id=chat_id,
        content=message.content,
        sender="user"
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    try:
        result = rag_chain.invoke({
                "question": message.content,
                "user_files": message.sources or [],
                "base_files": message.base_sources or [],
                "base_context": [],
                "user_context": [],
                "suggestions": [],
                "analysis_error": None,
                "answer": "",
                "mode": "",
        })
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Error interno al procesar la pregunta.")
    
    assistant_message = Message(
        chat_id=chat_id,
        content=result["answer"],
        sender="assistant"
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)
    return {                                    
        "user_message": user_message,
        "assistant_message": assistant_message
    }

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
