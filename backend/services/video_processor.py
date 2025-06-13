# backend/services/video_processor.py
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import cv2
import numpy as np
from core.config import settings

from services.ai_service import AIService
from services.websocket_manager import get_event_handler

logger = logging.getLogger(__name__)


class DemoVideoCapture:
    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        self.frame_count = 0
        self.is_opened = True
        colors = {
            "cam1": (50, 100, 150),
            "cam2": (50, 150, 50),
            "cam3": (150, 50, 150),
            "cam4": (150, 100, 50),
            "cam5": (150, 50, 50),
            "cam6": (100, 100, 100),
        }
        self.bg_color = colors.get(camera_id, (100, 100, 100))

    def isOpened(self) -> bool:
        return self.is_opened

    def read(self):
        if not self.is_opened:
            return False, None
        frame = np.full((480, 640, 3), self.bg_color, dtype=np.uint8)
        t = self.frame_count * 0.1
        x = int(320 + 200 * np.sin(t))
        y = int(240 + 100 * np.cos(t * 0.7))
        cv2.circle(frame, (x, y), 20, (255, 255, 255), -1)
        noise = np.random.randint(0, 20, frame.shape, dtype=np.uint8)
        frame = cv2.add(frame, noise)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(
            frame,
            f"{self.camera_id}: {timestamp}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
        )
        self.frame_count += 1
        return True, frame

    def release(self):
        self.is_opened = False


class CameraStream:
    def __init__(self, config: Dict[str, Any]):
        self.id = config["id"]
        self.name = config.get("name", self.id)
        self.url = config.get("url", "")
        self.config = config
        self.cap = None
        self.is_active = False
        self.status = "disconnected"
        self.error_count = 0

    async def connect(self) -> bool:
        await asyncio.sleep(0.5)
        demo_path = Path(settings.VIDEO_STORAGE_PATH) / f"{self.id}.mp4"
        cap = (
            cv2.VideoCapture(str(demo_path))
            if demo_path.exists()
            else DemoVideoCapture(self.id)
        )
        if cap and getattr(cap, "isOpened", lambda: True)():
            self.cap = cap
            self.is_active = True
            self.status = "connected"
            self.error_count = 0
            event_handler = get_event_handler()
            await event_handler.handle_camera_status_change(self.id, "online", {})
            return True
        else:
            self.status = "error"
            return False

    async def disconnect(self):
        self.is_active = False
        if self.cap:
            self.cap.release()
            self.cap = None
        self.status = "disconnected"
        event_handler = get_event_handler()
        await event_handler.handle_camera_status_change(self.id, "offline", {})

    def read_frame(self) -> Optional[np.ndarray]:
        if not self.is_active or not self.cap:
            return None
        ret, frame = self.cap.read()
        if ret:
            return frame
        self.error_count += 1
        if self.error_count > 5:
            self.status = "error"
        return None

    def get_status(self) -> Dict[str, Any]:
        return {"id": self.id, "name": self.name, "status": self.status, **self.config}


class VideoProcessor:
    def __init__(self):
        self.cameras: Dict[str, CameraStream] = {}
        self.ai = AIService()
        self.is_running = False

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        await self._load_cameras()

    async def _load_cameras(self):
        defaults = [
            {"id": "cam1", "name": "Front Entrance", "url": "", "enabled": True},
            {"id": "cam2", "name": "Parking Lot", "url": "", "enabled": True},
        ]
        for cfg in defaults:
            if cfg.get("enabled", True):
                await self.add_camera(cfg)

    async def add_camera(self, cfg: Dict[str, Any]) -> bool:
        cid = cfg["id"]
        if cid in self.cameras:
            return False
        cam = CameraStream(cfg)
        ok = await cam.connect()
        if ok:
            self.cameras[cid] = cam
        return ok

    async def remove_camera(self, camera_id: str) -> bool:
        cam = self.cameras.pop(camera_id, None)
        if cam:
            await cam.disconnect()
            return True
        return False

    def get_all_cameras_status(self) -> Dict[str, Dict[str, Any]]:
        return {cid: cam.get_status() for cid, cam in self.cameras.items()}

    def get_camera_status(self, camera_id: str) -> Optional[Dict[str, Any]]:
        cam = self.cameras.get(camera_id)
        return cam.get_status() if cam else None

    async def capture_frame(self, camera_id: str) -> Optional[np.ndarray]:
        cam = self.cameras.get(camera_id)
        return cam.read_frame() if cam else None

    async def save_frame(self, camera_id: str, frame: np.ndarray, filename: str) -> str:
        dirp = Path(settings.FRAME_STORAGE_PATH) / camera_id
        dirp.mkdir(parents=True, exist_ok=True)
        out = dirp / filename
        cv2.imwrite(str(out), frame)
        return str(out)

    async def get_camera_feed_url(self, camera_id: str) -> Optional[str]:
        if camera_id in self.cameras:
            return f"/api/cameras/{camera_id}/stream"
        return None


_video_processor = None


def get_video_processor() -> VideoProcessor:
    global _video_processor
    if _video_processor is None:
        _video_processor = VideoProcessor()
    return _video_processor
