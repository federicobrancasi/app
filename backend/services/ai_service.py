# backend/services/ai_service.py
import base64
import json
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
        self.system_prompt = """You are VisionGuard AI, an intelligent CCTV monitoring assistant. 
        You analyze video frames and help users understand what's happening in their surveillance footage.
        
        Your capabilities:
        - Analyze images from security cameras
        - Detect people, vehicles, objects, and activities
        - Identify unusual or suspicious behavior
        - Provide security recommendations
        - Answer questions about surveillance footage
        - Generate alerts and summaries
        
        Always be clear, concise, and security-focused in your responses.
        When analyzing images, describe what you see in detail and highlight any potential security concerns."""

    async def analyze_frame(
        self,
        frame: np.ndarray,
        camera_info: Dict[str, Any],
        detection_rules: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Analyze a single frame for events/anomalies"""
        try:
            # Convert frame to base64
            frame_b64 = self._frame_to_base64(frame)

            # Build analysis prompt
            rules_text = ""
            if detection_rules:
                rules_text = "\nSpecific detection rules for this camera:\n"
                for rule in detection_rules:
                    rules_text += f"- {rule.get('description', '')}\n"

            prompt = f"""Analyze this security camera frame from {camera_info.get('name', 'Unknown Camera')}.
            Location: {camera_info.get('location', 'Unknown')}
            Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            {rules_text}
            
            Please analyze and report:
            1. What people, vehicles, or objects do you see?
            2. What activities are taking place?
            3. Are there any security concerns or unusual behaviors?
            4. Confidence level (1-10) for any detections
            5. Recommended actions if any
            
            Respond in JSON format with the structure:
            {{
                "detected_objects": [
                    {{"type": "person/vehicle/object", "description": "...", "confidence": 8, "location": "..."}}
                ],
                "activities": ["..."],
                "security_concerns": ["..."],
                "overall_assessment": "...",
                "recommended_actions": ["..."],
                "alert_level": "low/medium/high/critical"
            }}"""

            message = await self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                system=self.system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": frame_b64,
                                },
                            },
                        ],
                    }
                ],
            )

            # Parse response
            response_text = message.content[0].text
            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                analysis = {
                    "detected_objects": [],
                    "activities": [],
                    "security_concerns": [],
                    "overall_assessment": response_text,
                    "recommended_actions": [],
                    "alert_level": "low",
                }

            analysis["timestamp"] = datetime.now().isoformat()
            analysis["camera_id"] = camera_info.get("id")

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return {
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "camera_id": camera_info.get("id"),
                "alert_level": "low",
            }

    async def chat_query(
        self,
        message: str,
        context: Dict[str, Any] = None,
        history: List[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Handle conversational queries about the surveillance system"""
        try:
            # Build context information
            context_text = ""
            if context:
                context_text = f"""
                Current system context:
                - Active cameras: {context.get('active_cameras', 0)}
                - Recent alerts: {context.get('recent_alerts', 0)}
                - System status: {context.get('system_status', 'unknown')}
                """

            # Build conversation history
            messages = []
            if history:
                for msg in history[-10:]:  # Last 10 messages for context
                    messages.append(
                        {
                            "role": msg.get("role", "user"),
                            "content": msg.get("content", ""),
                        }
                    )

            # Add current message
            messages.append(
                {
                    "role": "user",
                    "content": f"{context_text}\n\nUser question: {message}",
                }
            )

            response = await self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1500,
                system=self.system_prompt
                + "\n\nYou are now in chat mode. Answer user questions about their surveillance system, provide security advice, and help them understand their footage.",
                messages=messages,
            )

            return {
                "response": response.content[0].text,
                "timestamp": datetime.now().isoformat(),
                "type": "chat_response",
            }

        except Exception as e:
            logger.error(f"Error in chat query: {e}")
            return {
                "response": "I'm sorry, I encountered an error processing your request. Please try again.",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "type": "error",
            }

    async def generate_summary(
        self, events: List[Dict[str, Any]], timeframe: str = "today"
    ) -> Dict[str, Any]:
        """Generate a summary of events for a given timeframe"""
        try:
            events_text = ""
            for event in events:
                events_text += (
                    f"- {event.get('timestamp', '')}: {event.get('description', '')}\n"
                )

            prompt = f"""Generate a security summary for {timeframe} based on these events:
            
            {events_text}
            
            Please provide:
            1. Overall security assessment
            2. Key incidents or patterns
            3. Security recommendations
            4. Notable observations
            
            Keep it concise but informative."""

            response = await self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=800,
                system=self.system_prompt,
                messages=[{"role": "user", "content": prompt}],
            )

            return {
                "summary": response.content[0].text,
                "timeframe": timeframe,
                "events_analyzed": len(events),
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return {
                "summary": "Unable to generate summary at this time.",
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }

    def _frame_to_base64(self, frame: np.ndarray) -> str:
        """Convert OpenCV frame to base64 string"""
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buffer).decode("utf-8")

    async def detect_motion(
        self, frame1: np.ndarray, frame2: np.ndarray
    ) -> Dict[str, Any]:
        """Basic motion detection between two frames"""
        try:
            # Convert to grayscale
            gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)

            # Calculate difference
            diff = cv2.absdiff(gray1, gray2)

            # Threshold
            _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

            # Find contours
            contours, _ = cv2.findContours(
                thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            # Filter significant contours
            motion_areas = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if area > 500:  # Minimum area threshold
                    x, y, w, h = cv2.boundingRect(contour)
                    motion_areas.append(
                        {
                            "x": int(x),
                            "y": int(y),
                            "width": int(w),
                            "height": int(h),
                            "area": int(area),
                        }
                    )

            return {
                "motion_detected": len(motion_areas) > 0,
                "motion_areas": motion_areas,
                "total_motion_area": sum(area["area"] for area in motion_areas),
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error in motion detection: {e}")
            return {
                "motion_detected": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }
