import logging

from api.routes import cameras
from core.database import create_tables
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
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


# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.ALLOWED_ORIGINS,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Routers
app.include_router(cameras.router)


# WebSocket endpoint
@app.websocket("/ws/{client_id}")
async def ws_endpoint(websocket: WebSocket, client_id: str):
    mgr = get_websocket_manager()
    await mgr.connect(client_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # handle pings, subscriptions...
    except WebSocketDisconnect:
        await mgr.disconnect(client_id)


@app.on_event("startup")
async def on_startup():
    logger.info("Creating tables, starting video processor…")
    await create_tables()
    await get_video_processor().start()


@app.get("/health")
def health():
    vp = get_video_processor()
    return {
        "database": "ok",
        "video_processor": "running" if vp.is_running else "stopped",
    }
