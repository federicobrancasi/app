# backend/main.py
import logging

from api.routes import cameras, chat
from core.database import create_tables
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from services.ai_service import get_enhanced_ai_service
from services.video_analysis import get_video_analysis_service
from services.video_processor import get_video_processor
from services.websocket_manager import get_websocket_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="VisionGuard AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(cameras.router)
app.include_router(chat.router)


# WebSocket endpoint
@app.websocket("/ws/{client_id}")
async def ws_endpoint(websocket: WebSocket, client_id: str):
    mgr = get_websocket_manager()
    await mgr.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages
            import json

            try:
                message = json.loads(data)
                if message.get("type") == "subscribe_camera":
                    camera_id = message.get("camera_id")
                    if camera_id:
                        await mgr.subscribe_to_camera(client_id, camera_id)
                elif message.get("type") == "unsubscribe_camera":
                    camera_id = message.get("camera_id")
                    if camera_id:
                        await mgr.unsubscribe_from_camera(client_id, camera_id)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received from client {client_id}")
    except WebSocketDisconnect:
        await mgr.disconnect(client_id)


@app.on_event("startup")
async def on_startup():
    logger.info("Starting VisionGuard AI services...")

    # Create database tables
    await create_tables()

    # Start video processor
    await get_video_processor().start()

    # Start video analysis service
    video_analysis = get_video_analysis_service()
    await video_analysis.start()

    # Initialize enhanced AI service
    get_enhanced_ai_service()

    logger.info("All services started successfully")


@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Shutting down VisionGuard AI services...")

    # Stop video analysis service
    video_analysis = get_video_analysis_service()
    await video_analysis.stop()

    logger.info("Services shut down successfully")


@app.get("/health")
def health():
    vp = get_video_processor()
    video_analysis = get_video_analysis_service()
    ai_service = get_enhanced_ai_service()

    return {
        "status": "healthy",
        "database": "ok",
        "video_processor": "running" if vp.is_running else "stopped",
        "video_analysis": "running" if video_analysis.is_running else "stopped",
        "ai_service": "available" if ai_service.client else "fallback_mode",
        "total_detected_events": len(video_analysis.detected_events),
        "active_monitoring_tasks": len(
            [t for t in video_analysis.monitoring_tasks if t.active]
        ),
    }
