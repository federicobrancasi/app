import logging
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db
from services.video_processor import get_video_processor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/cameras", tags=["cameras"])


@router.get("/")
async def list_cameras():
    """Get list of all cameras"""
    try:
        vp = get_video_processor()
        status = vp.get_all_cameras_status()
        return {
            "cameras": status,
            "total": len(status),
            "online": sum(1 for s in status.values() if s["status"] == "connected"),
        }
    except Exception as e:
        logger.error(f"Error listing cameras: {e}")
        raise HTTPException(500, str(e))


@router.get("/{camera_id}")
async def get_camera(camera_id: str):
    """Get specific camera details"""
    try:
        vp = get_video_processor()
        cam = vp.get_camera_status(camera_id)
        if not cam:
            raise HTTPException(404, "Camera not found")
        return cam
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting camera {camera_id}: {e}")
        raise HTTPException(500, str(e))


@router.post("/")
async def add_camera(camera_config: Dict[str, Any]):
    """Add a new camera"""
    try:
        required = ["id", "name", "url"]
        for f in required:
            if f not in camera_config:
                raise HTTPException(400, f"Missing required field: {f}")

        camera_config.setdefault("enabled", True)
        camera_config.setdefault("ai_enabled", True)
        camera_config.setdefault("motion_detection", True)
        camera_config.setdefault("location", "Unknown")

        vp = get_video_processor()
        success = await vp.add_camera(camera_config)
        if not success:
            raise HTTPException(500, "Failed to add camera")

        return {"message": "Camera added", "camera_id": camera_config["id"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding camera: {e}")
        raise HTTPException(500, str(e))


@router.put("/{camera_id}")
async def update_camera(camera_id: str, cfg: Dict[str, Any]):
    """Update camera configuration"""
    try:
        vp = get_video_processor()
        if camera_id not in vp.cameras:
            raise HTTPException(404, "Camera not found")

        cam = vp.cameras[camera_id]
        cam.config.update(cfg)
        if "url" in cfg:
            await cam.disconnect()
            await cam.connect()

        return {"message": "Camera updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating {camera_id}: {e}")
        raise HTTPException(500, str(e))


@router.delete("/{camera_id}")
async def remove_camera(camera_id: str):
    """Remove a camera"""
    try:
        vp = get_video_processor()
        if not await vp.remove_camera(camera_id):
            raise HTTPException(404, "Camera not found")
        return {"message": "Camera removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing {camera_id}: {e}")
        raise HTTPException(500, str(e))


@router.post("/{camera_id}/capture")
async def capture_frame(camera_id: str):
    """Capture a single frame"""
    try:
        vp = get_video_processor()
        frame = await vp.capture_frame(camera_id)
        if frame is None:
            raise HTTPException(404, "Not found or inaccessible")

        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{camera_id}_{ts}.jpg"
        path = await vp.save_frame(camera_id, frame, filename)

        return {"message": "Captured", "filepath": path, "timestamp": datetime.now().isoformat()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error capturing from {camera_id}: {e}")
        raise HTTPException(500, str(e))


@router.get("/{camera_id}/stream")
async def get_stream_url(camera_id: str):
    """Return a stream URL (or placeholder)"""
    try:
        vp = get_video_processor()
        url = await vp.get_camera_feed_url(camera_id)
        if not url:
            raise HTTPException(404, "Camera not found")
        return {"stream_url": url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stream URL for {camera_id}: {e}")
        raise HTTPException(500, str(e))
