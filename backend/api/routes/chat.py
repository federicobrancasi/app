# backend/api/routes/chat.py
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import get_ai_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    response: str
    timestamp: str
    conversation_id: Optional[str] = None
    suggestions: Optional[List[str]] = None


@router.post("/", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage):
    """Send a message to the AI assistant and get a response"""
    try:
        if not message.message.strip():
            raise HTTPException(400, "Message cannot be empty")

        ai_service = get_ai_service()

        # Get AI response
        response_data = await ai_service.chat_query(
            message=message.message, context=message.context or {}
        )

        return ChatResponse(
            response=response_data["response"],
            timestamp=datetime.now().isoformat(),
            conversation_id=response_data.get("conversation_id"),
            suggestions=response_data.get("suggestions", []),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, "Failed to process chat message")


@router.get("/suggestions")
async def get_chat_suggestions():
    """Get suggested questions for the chat interface"""
    suggestions = [
        "Show me what happened in Camera 1 today",
        "Are all my cameras online and working?",
        "What security events occurred this week?",
        "Optimize camera settings for night vision",
        "Generate a security report for yesterday",
        "Help me troubleshoot Camera 2 connectivity issues",
    ]

    return {"suggestions": suggestions}


@router.get("/health")
async def chat_health():
    """Check if the AI chat service is available"""
    try:
        ai_service = get_ai_service()
        # Could add a simple test query here
        return {
            "status": "healthy",
            "ai_service": "available",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Chat health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }
