# backend/api/routes/chat.py
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.ai_service import get_enhanced_ai_service
from services.video_analysis import get_video_analysis_service

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
    action: Optional[str] = None
    source: Optional[str] = None


class MonitoringTaskResponse(BaseModel):
    tasks: List[Dict[str, Any]]
    total: int


class EventsResponse(BaseModel):
    events: List[Dict[str, Any]]
    summary: Dict[str, Any]
    total: int


@router.post("/", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage):
    """Send a message to the AI assistant and get a response with video analysis"""
    try:
        if not message.message.strip():
            raise HTTPException(400, "Message cannot be empty")

        # Get the enhanced AI service
        ai_service = get_enhanced_ai_service()

        # Process the message with video context
        response_data = await ai_service.chat_query(
            message=message.message, context=message.context or {}
        )

        # Generate contextual suggestions
        suggestions = _generate_contextual_suggestions(message.message, response_data)

        return ChatResponse(
            response=response_data["response"],
            timestamp=response_data["timestamp"],
            conversation_id=f"conv_{datetime.now().timestamp()}",
            suggestions=suggestions,
            action=response_data.get("action"),
            source=response_data.get("source", "ai_service"),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(500, f"Failed to process chat message: {str(e)}")


@router.get("/monitoring-tasks", response_model=MonitoringTaskResponse)
async def get_monitoring_tasks():
    """Get all active monitoring tasks"""
    try:
        video_service = get_video_analysis_service()
        tasks = [
            task.to_dict() for task in video_service.monitoring_tasks if task.active
        ]

        return MonitoringTaskResponse(tasks=tasks, total=len(tasks))
    except Exception as e:
        logger.error(f"Error getting monitoring tasks: {e}")
        raise HTTPException(500, "Failed to get monitoring tasks")


@router.delete("/monitoring-tasks/{task_id}")
async def remove_monitoring_task(task_id: str):
    """Remove a monitoring task"""
    try:
        video_service = get_video_analysis_service()
        success = video_service.remove_monitoring_task(task_id)

        if not success:
            raise HTTPException(404, "Monitoring task not found")

        return {"message": "Monitoring task removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing monitoring task: {e}")
        raise HTTPException(500, "Failed to remove monitoring task")


@router.get("/events", response_model=EventsResponse)
async def get_events(camera_ids: Optional[str] = None, hours: Optional[int] = 24):
    """Get detected events for analysis"""
    try:
        video_service = get_video_analysis_service()

        # Parse camera IDs
        camera_list = None
        if camera_ids:
            camera_list = [cam.strip() for cam in camera_ids.split(",")]

        # Get events from the last N hours
        from datetime import timedelta

        start_time = datetime.now() - timedelta(hours=hours)

        events = video_service.get_events_for_period(
            camera_ids=camera_list, start_time=start_time
        )

        # Get summary
        summary = video_service.get_events_summary(
            camera_ids=camera_list, start_time=start_time
        )

        return EventsResponse(
            events=[event.to_dict() for event in events],
            summary=summary,
            total=len(events),
        )

    except Exception as e:
        logger.error(f"Error getting events: {e}")
        raise HTTPException(500, "Failed to get events")


@router.get("/frame/{camera_id}")
async def get_current_frame(camera_id: str):
    """Get current frame from a specific camera"""
    try:
        ai_service = get_enhanced_ai_service()
        frame_data = await ai_service._get_current_frame(camera_id)

        if not frame_data:
            raise HTTPException(404, f"Could not get frame from camera {camera_id}")

        return {
            "camera_id": camera_id,
            "frame_data": frame_data,
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting frame from {camera_id}: {e}")
        raise HTTPException(500, f"Failed to get frame from camera {camera_id}")


@router.get("/suggestions")
async def get_chat_suggestions():
    """Get suggested questions for the chat interface"""
    suggestions = [
        {
            "text": "Monitor for package deliveries at the front door",
            "category": "Monitoring Setup",
            "icon": "package",
        },
        {
            "text": "What happened today?",
            "category": "Event Analysis",
            "icon": "calendar",
        },
        {
            "text": "Show me what's happening now",
            "category": "Live Analysis",
            "icon": "eye",
        },
        {
            "text": "Are all my cameras working properly?",
            "category": "System Status",
            "icon": "shield",
        },
        {
            "text": "Alert me if anyone approaches the back entrance",
            "category": "Security Monitoring",
            "icon": "bell",
        },
        {
            "text": "What security events occurred this week?",
            "category": "Weekly Summary",
            "icon": "trending-up",
        },
    ]

    return {"suggestions": suggestions}


@router.get("/health")
async def chat_health():
    """Check if the AI chat service is available"""
    try:
        ai_service = get_enhanced_ai_service()
        video_service = get_video_analysis_service()

        # Check if video analysis is running
        video_status = "running" if video_service.is_running else "stopped"

        # Check if Claude API is available
        claude_status = "available" if ai_service.client else "fallback_mode"

        return {
            "status": "healthy",
            "ai_service": claude_status,
            "video_analysis": video_status,
            "total_events": len(video_service.detected_events),
            "active_monitoring_tasks": len(
                [t for t in video_service.monitoring_tasks if t.active]
            ),
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        logger.error(f"Chat health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


def _generate_contextual_suggestions(
    message: str, response_data: Dict[str, Any]
) -> List[str]:
    """Generate contextual suggestions based on the conversation"""
    message_lower = message.lower()
    action = response_data.get("action")

    # Suggestions based on actions taken
    if action == "setup_monitoring":
        return [
            "What events are you currently monitoring?",
            "Show me recent activity",
            "How do I stop a monitoring task?",
            "Set up another monitoring alert",
        ]
    elif action == "events_summary":
        return [
            "Show me more details about recent events",
            "Monitor for unusual activity",
            "What's happening right now?",
            "Generate a security report",
        ]
    elif action == "frame_analysis":
        return [
            "What happened in the last hour?",
            "Monitor this camera for deliveries",
            "Are there any security concerns?",
            "Optimize this camera's settings",
        ]

    # Suggestions based on message content
    if any(word in message_lower for word in ["delivery", "package"]):
        return [
            "Monitor for vehicle arrivals",
            "What delivery events happened this week?",
            "Set up alerts for front door activity",
            "Show me today's visitor activity",
        ]
    elif any(word in message_lower for word in ["happened", "events", "activity"]):
        return [
            "Monitor for future events",
            "Show me live camera feeds",
            "Set up custom alerts",
            "Generate a detailed report",
        ]
    elif any(word in message_lower for word in ["monitor", "watch", "alert"]):
        return [
            "What are you currently monitoring?",
            "Show me recent detections",
            "How sensitive are the alerts?",
            "Monitor additional cameras",
        ]

    # Default suggestions
    return [
        "What happened today?",
        "Monitor for package deliveries",
        "Show me live camera feeds",
        "Are all cameras working properly?",
        "Set up a custom alert",
        "Generate a security summary",
    ]
