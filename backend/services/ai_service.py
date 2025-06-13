import base64
import logging
from datetime import datetime
from typing import Any, Dict, List

import cv2
import numpy as np
from anthropic import AsyncAnthropic
from core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.system_prompt = "You are VisionGuard AI, an intelligent CCTV assistant..."

    async def chat_query(
        self,
        message: str,
        context: Dict[str, Any] = None,
        history: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # ... implement chat as before, using self.client.messages.create()
        return {"response": "placeholder", "timestamp": datetime.now().isoformat()}

    def _frame_to_base64(self, frame: np.ndarray) -> str:
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buf).decode("utf-8")
