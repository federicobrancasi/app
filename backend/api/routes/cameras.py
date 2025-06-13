# backend/api/routes/cameras.py
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from core.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from services.video_processor import get_video_processor

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/")
async def list_cameras():
    """Get list of all cameras"""
    try:
        video_processor = get_video_processor()
        cameras_status = video_processor.get_all_cameras_status()

        return {
            "cameras": cameras_status,
            "total": len(cameras_status),
            "online": sum(
                1
                for status in cameras_status.values()
                if status["status"] == "connected"
            ),
        }
    except Exception as e:
        logger.error(f"Error listing cameras: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{camera_id}")
async def get_camera(camera_id: str):
    """Get specific camera details"""
    try:
        video_processor = get_video_processor()
        camera_status = video_processor.get_camera_status(camera_id)

        if not camera_status:
            raise HTTPException(status_code=404, detail="Camera not found")

        return camera_status
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting camera {camera_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def add_camera(camera_config: Dict[str, Any]):
    """Add a new camera"""
    try:
        video_processor = get_video_processor()

        # Validate required fields
        required_fields = ["id", "name", "url"]
        for field in required_fields:
            if field not in camera_config:
                raise HTTPException(
                    status_code=400, detail=f"Missing required field: {field}"
                )

        # Add default values
        camera_config.setdefault("enabled", True)
        camera_config.setdefault("ai_enabled", True)
        camera_config.setdefault("motion_detection", True)
        camera_config.setdefault("location", "Unknown")

        success = await video_processor.add_camera(camera_config)

        if success:
            return {
                "message": "Camera added successfully",
                "camera_id": camera_config["id"],
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to add camera")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding camera: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{camera_id}")
async def update_camera(camera_id: str, camera_config: Dict[str, Any]):
    """Update camera configuration"""
    try:
        video_processor = get_video_processor()

        # Check if camera exists
        if camera_id not in video_processor.cameras:
            raise HTTPException(status_code=404, detail="Camera not found")

        # Update camera configuration
        camera = video_processor.cameras[camera_id]
        camera.config.update(camera_config)

        # Reconnect if URL changed
        if "url" in camera_config:
            await camera.disconnect()
            await camera.connect()

        return {"message": "Camera updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating camera {camera_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{camera_id}")
async def remove_camera(camera_id: str):
    """Remove a camera"""
    try:
        video_processor = get_video_processor()
        success = await video_processor.remove_camera(camera_id)

        if success:
            return {"message": "Camera removed successfully"}
        else:
            raise HTTPException(status_code=404, detail="Camera not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing camera {camera_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{camera_id}/capture")
async def capture_frame(camera_id: str):
    """Capture a frame from camera"""
    try:
        video_processor = get_video_processor()
        frame = await video_processor.capture_frame(camera_id)

        if frame is None:
            raise HTTPException(
                status_code=404, detail="Camera not found or not accessible"
            )

        # Save frame and return path
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"capture_{timestamp}.jpg"
        filepath = await video_processor.save_frame(camera_id, frame, filename)

        return {
            "message": "Frame captured successfully",
            "filepath": filepath,
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error capturing frame from {camera_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{camera_id}/stream")
async def get_stream_url(camera_id: str):
    """Get streaming URL for camera"""
    try:
        video_processor = get_video_processor()
        stream_url = await video_processor.get_camera_feed_url(camera_id)

        if not stream_url:
            raise HTTPException(status_code=404, detail="Camera not found")

        return {"stream_url": stream_url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stream URL for {camera_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


import logging
from datetime import timedelta
from typing import Any, Dict

# backend/api/routes/events.py
from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)
router = APIRouter()

# Sample events storage (in production, use database)
events_storage = []


@router.get("/")
async def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    camera_id: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
):
    """Get list of security events with filtering"""
    try:
        filtered_events = events_storage.copy()

        # Apply filters
        if severity:
            filtered_events = [
                e for e in filtered_events if e.get("severity") == severity
            ]

        if status:
            filtered_events = [e for e in filtered_events if e.get("status") == status]

        if camera_id:
            filtered_events = [
                e for e in filtered_events if e.get("camera_id") == camera_id
            ]

        if start_date:
            filtered_events = [
                e
                for e in filtered_events
                if datetime.fromisoformat(e.get("timestamp", "")) >= start_date
            ]

        if end_date:
            filtered_events = [
                e
                for e in filtered_events
                if datetime.fromisoformat(e.get("timestamp", "")) <= end_date
            ]

        # Sort by timestamp (newest first)
        filtered_events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        # Apply pagination
        total = len(filtered_events)
        events = filtered_events[skip : skip + limit]

        return {"events": events, "total": total, "skip": skip, "limit": limit}

    except Exception as e:
        logger.error(f"Error listing events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{event_id}")
async def get_event(event_id: str):
    """Get specific event details"""
    try:
        event = next((e for e in events_storage if e.get("id") == event_id), None)

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        return event

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{event_id}/status")
async def update_event_status(event_id: str, status_data: Dict[str, Any]):
    """Update event status"""
    try:
        event = next((e for e in events_storage if e.get("id") == event_id), None)

        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Update status
        new_status = status_data.get("status")
        if new_status not in ["new", "acknowledged", "resolved", "false_positive"]:
            raise HTTPException(status_code=400, detail="Invalid status")

        event["status"] = new_status
        event["updated_at"] = datetime.now().isoformat()

        if "assignee" in status_data:
            event["assigned_to"] = status_data["assignee"]

        if "notes" in status_data:
            event["notes"] = status_data["notes"]

        return event

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{event_id}")
async def delete_event(event_id: str):
    """Delete an event"""
    try:
        global events_storage
        initial_count = len(events_storage)
        events_storage = [e for e in events_storage if e.get("id") != event_id]

        if len(events_storage) == initial_count:
            raise HTTPException(status_code=404, detail="Event not found")

        return {"message": "Event deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event {event_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_events_summary():
    """Get events summary statistics"""
    try:
        total_events = len(events_storage)

        # Count by severity
        severity_counts = {}
        for event in events_storage:
            severity = event.get("severity", "unknown")
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        # Count by status
        status_counts = {}
        for event in events_storage:
            status = event.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

        # Recent events (last 24 hours)
        yesterday = datetime.now() - timedelta(days=1)
        recent_events = [
            e
            for e in events_storage
            if datetime.fromisoformat(e.get("timestamp", "")) >= yesterday
        ]

        return {
            "total_events": total_events,
            "recent_events_24h": len(recent_events),
            "severity_breakdown": severity_counts,
            "status_breakdown": status_counts,
            "unresolved_count": sum(
                count
                for status, count in status_counts.items()
                if status in ["new", "acknowledged"]
            ),
        }

    except Exception as e:
        logger.error(f"Error getting events summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


import logging
from datetime import datetime
from typing import Any, Dict

# backend/api/routes/chat.py
from fastapi import APIRouter
from services.ai_service import AIService

logger = logging.getLogger(__name__)
router = APIRouter()

# Chat history storage (in production, use database)
chat_sessions = {}


@router.post("/message")
async def send_message(message_data: Dict[str, Any]):
    """Send message to AI assistant"""
    try:
        ai_service = AIService()

        session_id = message_data.get("session_id", "default")
        user_message = message_data.get("message", "")
        context = message_data.get("context", {})

        if not user_message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        # Get or create chat history
        if session_id not in chat_sessions:
            chat_sessions[session_id] = []

        history = chat_sessions[session_id]

        # Add user message to history
        user_msg = {
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat(),
        }
        history.append(user_msg)

        # Get AI response
        ai_response = await ai_service.chat_query(user_message, context, history)

        # Add AI response to history
        ai_msg = {
            "role": "assistant",
            "content": ai_response.get("response", ""),
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "type": ai_response.get("type", "chat_response"),
                "session_id": session_id,
            },
        }
        history.append(ai_msg)

        # Keep only last 50 messages
        if len(history) > 50:
            history = history[-50:]
            chat_sessions[session_id] = history

        return ai_response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for session"""
    try:
        history = chat_sessions.get(session_id, [])
        return {
            "session_id": session_id,
            "messages": history,
            "total_messages": len(history),
        }

    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for session"""
    try:
        if session_id in chat_sessions:
            del chat_sessions[session_id]

        return {"message": "Chat history cleared"}

    except Exception as e:
        logger.error(f"Error clearing chat history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_with_ai(analysis_request: Dict[str, Any]):
    """Request AI analysis of specific data"""
    try:
        ai_service = AIService()

        analysis_type = analysis_request.get("type")
        data = analysis_request.get("data", {})

        if analysis_type == "frame_analysis":
            # Analyze specific frame
            camera_id = data.get("camera_id")
            frame_data = data.get("frame_data")

            if not camera_id or not frame_data:
                raise HTTPException(
                    status_code=400, detail="Missing camera_id or frame_data"
                )

            # This would typically decode base64 frame and analyze
            result = {
                "analysis_id": str(uuid.uuid4()),
                "type": "frame_analysis",
                "camera_id": camera_id,
                "timestamp": datetime.now().isoformat(),
                "result": "Frame analysis completed - placeholder result",
            }

        elif analysis_type == "event_summary":
            # Generate event summary
            timeframe = data.get("timeframe", "today")
            events = data.get("events", [])

            summary_result = await ai_service.generate_summary(events, timeframe)
            result = {
                "analysis_id": str(uuid.uuid4()),
                "type": "event_summary",
                "timeframe": timeframe,
                "timestamp": datetime.now().isoformat(),
                "result": summary_result,
            }

        else:
            raise HTTPException(status_code=400, detail="Unknown analysis type")

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


import logging
from datetime import datetime
from typing import Any, Dict

import jwt

# backend/api/routes/auth.py
from fastapi import APIRouter
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Simple in-memory user storage (use database in production)
users_db = {
    "admin": {
        "username": "admin",
        "password": "admin123",  # In production, use hashed passwords
        "role": "administrator",
        "permissions": ["read", "write", "admin"],
    },
    "operator": {
        "username": "operator",
        "password": "operator123",
        "role": "operator",
        "permissions": ["read", "write"],
    },
    "viewer": {
        "username": "viewer",
        "password": "viewer123",
        "role": "viewer",
        "permissions": ["read"],
    },
}

SECRET_KEY = "your-secret-key-change-in-production"


@router.post("/login")
async def login(credentials: Dict[str, str]):
    """User login"""
    try:
        username = credentials.get("username")
        password = credentials.get("password")

        if not username or not password:
            raise HTTPException(
                status_code=400, detail="Username and password required"
            )

        user = users_db.get(username)
        if not user or user["password"] != password:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Generate JWT token
        payload = {
            "username": username,
            "role": user["role"],
            "permissions": user["permissions"],
            "exp": datetime.utcnow() + timedelta(hours=24),
        }

        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "username": username,
                "role": user["role"],
                "permissions": user["permissions"],
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """User logout"""
    # In a real implementation, you might blacklist the token
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Get current user info"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

        username = payload.get("username")
        user = users_db.get(username)

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return {
            "username": username,
            "role": user["role"],
            "permissions": user["permissions"],
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


import logging
from datetime import datetime
from typing import Any, Dict, Optional

# backend/api/routes/analytics.py
from fastapi import APIRouter, Query

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics data"""
    try:
        # In production, this would query actual analytics data
        return {
            "cameras": {
                "total": 10,
                "online": 8,
                "offline": 2,
                "uptime_percentage": 95.2,
            },
            "events": {
                "today": 24,
                "this_week": 156,
                "critical_alerts": 3,
                "resolved_events": 18,
            },
            "ai_analysis": {
                "frames_analyzed_today": 1440,
                "detections_today": 89,
                "accuracy_rate": 94.7,
                "false_positives": 5,
            },
            "system": {
                "uptime": "99.8%",
                "cpu_usage": 45.2,
                "memory_usage": 67.8,
                "storage_used": 23.4,
            },
        }

    except Exception as e:
        logger.error(f"Error getting dashboard analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def get_trends(
    period: str = Query("7d", regex="^(1d|7d|30d|90d)$"),
    metric: str = Query("events", regex="^(events|detections|alerts|uptime)$"),
):
    """Get trend data for specified period and metric"""
    try:
        # Generate sample trend data
        import random

        days = {"1d": 1, "7d": 7, "30d": 30, "90d": 90}[period]
        data_points = []

        base_date = datetime.now() - timedelta(days=days)

        for i in range(days):
            date = base_date + timedelta(days=i)

            if metric == "events":
                value = random.randint(15, 45)
            elif metric == "detections":
                value = random.randint(50, 150)
            elif metric == "alerts":
                value = random.randint(0, 8)
            else:  # uptime
                value = random.uniform(98.0, 100.0)

            data_points.append({"date": date.strftime("%Y-%m-%d"), "value": value})

        return {
            "metric": metric,
            "period": period,
            "data": data_points,
            "summary": {
                "total": sum(point["value"] for point in data_points),
                "average": sum(point["value"] for point in data_points)
                / len(data_points),
                "max": max(point["value"] for point in data_points),
                "min": min(point["value"] for point in data_points),
            },
        }

    except Exception as e:
        logger.error(f"Error getting trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/generate")
async def generate_report(
    report_type: str = Query(..., regex="^(daily|weekly|monthly|custom)$"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    cameras: Optional[str] = Query(None),  # Comma-separated camera IDs
):
    """Generate analytics report"""
    try:
        # In production, this would generate actual reports
        report_id = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Parse camera filter
        camera_list = cameras.split(",") if cameras else []

        # Determine date range
        if report_type == "daily":
            start_date = datetime.now().replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            end_date = start_date + timedelta(days=1)
        elif report_type == "weekly":
            start_date = datetime.now() - timedelta(days=7)
            end_date = datetime.now()
        elif report_type == "monthly":
            start_date = datetime.now() - timedelta(days=30)
            end_date = datetime.now()

        return {
            "report_id": report_id,
            "type": report_type,
            "status": "generating",
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "cameras": camera_list,
            "estimated_completion": (datetime.now() + timedelta(minutes=5)).isoformat(),
            "download_url": f"/api/analytics/reports/{report_id}/download",
        }

    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# backend/core/database.py
import logging
from datetime import datetime
from typing import AsyncGenerator

from core.config import settings
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

# Create async engine
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, future=True)

# Create async session maker
async_session_maker = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


# Database Models
class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    location = Column(String)
    ip_address = Column(String)
    port = Column(Integer)
    username = Column(String)
    password = Column(String)
    stream_url = Column(String)
    status = Column(String, default="offline")
    enabled = Column(Boolean, default=True)
    ai_enabled = Column(Boolean, default=True)
    motion_detection = Column(Boolean, default=True)
    recording = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True)
    camera_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    severity = Column(String, default="low")
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="new")
    confidence = Column(Float)
    metadata = Column(Text)  # JSON string
    assigned_to = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    level = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    module = Column(String)
    camera_id = Column(String)
    metadata = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)


# Database functions
async def create_tables():
    """Create database tables"""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session"""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Database utilities
class DatabaseManager:
    """Database management utilities"""

    @staticmethod
    async def get_camera(session: AsyncSession, camera_id: str) -> Camera:
        """Get camera by ID"""
        result = await session.get(Camera, camera_id)
        return result

    @staticmethod
    async def create_camera(session: AsyncSession, camera_data: dict) -> Camera:
        """Create new camera"""
        camera = Camera(**camera_data)
        session.add(camera)
        await session.commit()
        await session.refresh(camera)
        return camera

    @staticmethod
    async def update_camera(
        session: AsyncSession, camera_id: str, update_data: dict
    ) -> Camera:
        """Update camera"""
        camera = await session.get(Camera, camera_id)
        if camera:
            for key, value in update_data.items():
                setattr(camera, key, value)
            camera.updated_at = datetime.utcnow()
            await session.commit()
            await session.refresh(camera)
        return camera

    @staticmethod
    async def create_event(session: AsyncSession, event_data: dict) -> Event:
        """Create new event"""
        event = Event(**event_data)
        session.add(event)
        await session.commit()
        await session.refresh(event)
        return event

    @staticmethod
    async def log_system_event(
        session: AsyncSession,
        level: str,
        message: str,
        module: str = None,
        camera_id: str = None,
        metadata: dict = None,
    ):
        """Log system event"""
        import json

        log_entry = SystemLog(
            level=level,
            message=message,
            module=module,
            camera_id=camera_id,
            metadata=json.dumps(metadata) if metadata else None,
        )
        session.add(log_entry)
        await session.commit()


# Global database manager instance
db_manager = DatabaseManager()


# Migration utilities
async def run_migrations():
    """Run database migrations"""
    try:
        # In production, use Alembic for migrations
        await create_tables()
        logger.info("Database migrations completed")
    except Exception as e:
        logger.error(f"Error running migrations: {e}")
        raise


# Health check
async def check_database_health() -> bool:
    """Check database connectivity"""
    try:
        async with async_session_maker() as session:
            await session.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
