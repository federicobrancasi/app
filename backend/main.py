# backend/main.py
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from api.routes import auth, cameras, chat, events
from core.config import settings
from core.database import create_tables
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from services.ai_service import AIService
from services.video_processor import VideoProcessor
from services.websocket_manager import WebSocketManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global managers
websocket_manager = WebSocketManager()
video_processor = VideoProcessor()
ai_service = AIService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting VisionGuard AI...")

    # Initialize database
    await create_tables()

    # Start background services
    await video_processor.start()

    logger.info("✅ VisionGuard AI started successfully!")

    yield

    # Cleanup
    logger.info("🛑 Shutting down VisionGuard AI...")
    await video_processor.stop()
    await websocket_manager.disconnect_all()


# Create FastAPI app
app = FastAPI(
    title="VisionGuard AI API",
    description="Intelligent CCTV monitoring with AI",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(cameras.router, prefix="/api/cameras", tags=["cameras"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(chat.router, prefix="/api/chat", tags=["ai-chat"])


# WebSocket endpoint for real-time communication
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket_manager.connect(client_id, websocket)
    try:
        while True:
            # Listen for client messages
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            if message.get("type") == "ping":
                await websocket_manager.send_to_client(
                    client_id, {"type": "pong", "timestamp": datetime.now().isoformat()}
                )
            elif message.get("type") == "subscribe_camera":
                camera_id = message.get("camera_id")
                await websocket_manager.subscribe_to_camera(client_id, camera_id)
            elif message.get("type") == "unsubscribe_camera":
                camera_id = message.get("camera_id")
                await websocket_manager.unsubscribe_from_camera(client_id, camera_id)

    except WebSocketDisconnect:
        await websocket_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        await websocket_manager.disconnect(client_id)


# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "database": "connected",
            "video_processor": "running" if video_processor.is_running else "stopped",
            "websocket_connections": len(websocket_manager.active_connections),
            "ai_service": "available",
        },
    }


# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to VisionGuard AI", "version": "1.0.0", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
