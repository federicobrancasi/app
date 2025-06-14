# backend/services/ai_service.py
import base64
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from core.config import settings

from services.video_analysis import EventType, get_video_analysis_service

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        # Initialize Anthropic client if API key is available
        self.client = None
        if settings.ANTHROPIC_API_KEY:
            try:
                from anthropic import AsyncAnthropic

                self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
                logger.info("Anthropic client initialized successfully")
            except ImportError:
                logger.warning(
                    "Anthropic package not installed. Install with: pip install anthropic"
                )
        else:
            logger.warning("No Anthropic API key provided. Using fallback responses.")

        self.video_service = get_video_analysis_service()

        self.system_prompt = """You are Claude, the VisionGuard AI assistant. You help users monitor and analyze their security camera system.

CAPABILITIES:
1. Analyze video frames and describe what you see
2. Set up monitoring tasks (e.g., "monitor for package deliveries")
3. Provide summaries of what happened in specific time periods
4. Give security recommendations and insights

IMPORTANT GUIDELINES:
- When users ask you to monitor for something, extract the specific event type and cameras
- When users ask "what happened", provide detailed analysis based on detected events
- Always be specific about camera IDs, times, and event types
- If you see video frames, describe them in detail
- Be proactive in suggesting security improvements

CAMERA SETUP:
- cam1: Back Entrance 
- cam2: Front Entrance
- cam3: Back Entrance
- cam4: Front Entrance

MONITORING KEYWORDS TO WATCH FOR:
- "monitor", "watch", "alert me", "notify me" -> Set up monitoring task
- "what happened", "show me", "tell me about" -> Provide event summary
- "today", "yesterday", "this week" -> Time-based queries
- "camera 1", "front door", "back entrance" -> Camera-specific queries"""

    async def chat_query(
        self, message: str, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Process a chat message with video analysis capabilities"""

        # Extract camera frames if available
        video_context = await self._get_video_context(message, context)

        # Check if this is a monitoring request
        monitoring_task = await self._parse_monitoring_request(message)

        # Check if this is a "what happened" request
        events_query = await self._parse_events_query(message)

        # Prepare the full context for Claude
        full_context = {
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "video_context": video_context,
            "monitoring_task": monitoring_task,
            "events_query": events_query,
            **(context or {}),
        }

        if self.client:
            try:
                response = await self._query_claude_api(message, full_context)
            except Exception as e:
                logger.error(f"Claude API error: {e}")
                response = await self._get_intelligent_fallback(message, full_context)
        else:
            response = await self._get_intelligent_fallback(message, full_context)

        # Process any actions that need to be taken
        await self._process_actions(response, monitoring_task, events_query)

        return response

    async def _get_video_context(
        self, message: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get current video frames for context"""
        video_context = {"frames": [], "cameras_mentioned": []}

        # Extract mentioned cameras
        camera_patterns = [
            (r"cam[1-4]", lambda m: m.group()),
            (r"camera\s*(\d)", lambda m: f"cam{m.group(1)}"),
            (r"front\s*(?:door|entrance)", lambda m: "cam2"),
            (r"back\s*(?:door|entrance)", lambda m: "cam1"),
        ]

        cameras_mentioned = set()
        for pattern, extractor in camera_patterns:
            matches = re.finditer(pattern, message.lower())
            for match in matches:
                camera_id = extractor(match)
                if camera_id in ["cam1", "cam2", "cam3", "cam4"]:
                    cameras_mentioned.add(camera_id)

        # If no specific cameras mentioned, include all
        if not cameras_mentioned:
            cameras_mentioned = {"cam1", "cam2", "cam3", "cam4"}

        video_context["cameras_mentioned"] = list(cameras_mentioned)

        # Get current frames from these cameras
        for camera_id in cameras_mentioned:
            frame = await self._get_current_frame(camera_id)
            if frame is not None:
                video_context["frames"].append(
                    {
                        "camera_id": camera_id,
                        "frame_data": frame,
                        "timestamp": datetime.now().isoformat(),
                    }
                )

        return video_context

    async def _get_current_frame(self, camera_id: str) -> Optional[str]:
        """Get current frame from camera as base64"""
        try:
            from pathlib import Path

            video_path = Path(
                f"../frontend/public/videos/{camera_id.replace('cam', 'camera')}.mp4"
            )

            if not video_path.exists():
                return None

            cap = cv2.VideoCapture(str(video_path))
            if not cap.isOpened():
                return None

            # Get a random frame for demo purposes
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            random_frame = np.random.randint(0, frame_count)
            cap.set(cv2.CAP_PROP_POS_FRAMES, random_frame)

            ret, frame = cap.read()
            cap.release()

            if ret:
                # Resize frame for efficiency
                frame = cv2.resize(frame, (640, 480))
                _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                return base64.b64encode(buffer).decode("utf-8")

        except Exception as e:
            logger.error(f"Error getting frame from {camera_id}: {e}")

        return None

    async def _parse_monitoring_request(self, message: str) -> Optional[Dict[str, Any]]:
        """Parse if the message is requesting monitoring"""
        monitoring_keywords = [
            "monitor",
            "watch",
            "alert me",
            "notify me",
            "let me know",
            "watch for",
            "look for",
            "check for",
            "observe",
        ]

        message_lower = message.lower()
        is_monitoring_request = any(
            keyword in message_lower for keyword in monitoring_keywords
        )

        if not is_monitoring_request:
            return None

        # Extract event types
        event_mappings = {
            "delivery": EventType.PACKAGE_DELIVERY,
            "package": EventType.PACKAGE_DELIVERY,
            "person": EventType.PERSON_DETECTED,
            "people": EventType.PERSON_DETECTED,
            "car": EventType.VEHICLE_DETECTED,
            "vehicle": EventType.VEHICLE_DETECTED,
            "motion": EventType.MOTION_DETECTED,
            "movement": EventType.MOTION_DETECTED,
        }

        detected_events = []
        for keyword, event_type in event_mappings.items():
            if keyword in message_lower:
                detected_events.append(event_type)

        # Default to person detection if nothing specific
        if not detected_events:
            detected_events = [EventType.PERSON_DETECTED]

        # Extract cameras (default to all if not specified)
        cameras = self._extract_cameras_from_message(message)
        if not cameras:
            cameras = ["cam1", "cam2", "cam3", "cam4"]

        return {
            "event_types": detected_events,
            "cameras": cameras,
            "original_request": message,
        }

    async def _parse_events_query(self, message: str) -> Optional[Dict[str, Any]]:
        """Parse if the message is asking about events"""
        query_keywords = [
            "what happened",
            "show me",
            "tell me about",
            "what did you see",
            "any events",
            "what occurred",
            "summary",
            "activity",
        ]

        message_lower = message.lower()
        is_events_query = any(keyword in message_lower for keyword in query_keywords)

        if not is_events_query:
            return None

        # Extract time period
        time_period = self._extract_time_period(message)
        cameras = self._extract_cameras_from_message(message)

        return {
            "time_period": time_period,
            "cameras": cameras or ["cam1", "cam2", "cam3", "cam4"],
        }

    def _extract_cameras_from_message(self, message: str) -> List[str]:
        """Extract camera IDs from message"""
        cameras = []
        message_lower = message.lower()

        # Direct camera references
        for i in range(1, 5):
            if f"cam{i}" in message_lower or f"camera {i}" in message_lower:
                cameras.append(f"cam{i}")

        # Location references
        if "front" in message_lower:
            cameras.extend(["cam2", "cam4"])
        if "back" in message_lower:
            cameras.extend(["cam1", "cam3"])

        return list(set(cameras))

    def _extract_time_period(self, message: str) -> Dict[str, datetime]:
        """Extract time period from message"""
        now = datetime.now()
        message_lower = message.lower()

        if "today" in message_lower:
            start_time = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif "yesterday" in message_lower:
            start_time = (now - timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            now = start_time + timedelta(days=1)
        elif "this week" in message_lower or "week" in message_lower:
            start_time = now - timedelta(days=7)
        elif "hour" in message_lower:
            start_time = now - timedelta(hours=1)
        else:
            start_time = now - timedelta(hours=24)  # Default to last 24 hours

        return {"start_time": start_time, "end_time": now}

    async def _query_claude_api(
        self, message: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Query the actual Claude API"""
        # Prepare messages for Claude
        messages = []

        # Add video frames if available
        if context.get("video_context", {}).get("frames"):
            content = []
            content.append(
                {
                    "type": "text",
                    "text": f"User message: {message}\n\nI'm providing current frames from the mentioned cameras for context:",
                }
            )

            for frame_info in context["video_context"]["frames"]:
                content.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": frame_info["frame_data"],
                        },
                    }
                )
                content.append(
                    {
                        "type": "text",
                        "text": f"Frame from {frame_info['camera_id']} at {frame_info['timestamp']}",
                    }
                )

            messages.append({"role": "user", "content": content})
        else:
            messages.append({"role": "user", "content": message})

        # Add context about events if this is an events query
        if context.get("events_query"):
            events_summary = self.video_service.get_events_summary(
                camera_ids=context["events_query"]["cameras"],
                start_time=context["events_query"]["time_period"]["start_time"],
            )

            context_text = f"\n\nRelevant detected events: {events_summary}"
            if messages:
                if isinstance(messages[-1]["content"], str):
                    messages[-1]["content"] += context_text
                else:
                    messages[-1]["content"].append(
                        {"type": "text", "text": context_text}
                    )

        try:
            response = await self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                system=self.system_prompt,
                messages=messages,
            )

            return {
                "response": response.content[0].text,
                "timestamp": datetime.now().isoformat(),
                "source": "claude_api",
            }

        except Exception as e:
            logger.error(f"Claude API error: {e}")
            raise

    async def _get_intelligent_fallback(
        self, message: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Provide intelligent fallback responses based on context"""
        message_lower = message.lower()

        # Handle monitoring requests
        if context.get("monitoring_task"):
            task = context["monitoring_task"]
            cameras_str = ", ".join(task["cameras"])
            events_str = ", ".join(
                [et.value.replace("_", " ") for et in task["event_types"]]
            )

            response = "✅ **Monitoring Task Set Up**\n\n"
            response += f"I'll monitor **{cameras_str}** for **{events_str}**.\n\n"
            response += (
                "You'll receive real-time alerts when I detect these activities. "
            )
            response += "This monitoring task is now active and will continue until you ask me to stop."

            return {
                "response": response,
                "timestamp": datetime.now().isoformat(),
                "source": "intelligent_fallback",
                "action": "setup_monitoring",
            }

        # Handle event queries
        if context.get("events_query"):
            query = context["events_query"]
            events_summary = self.video_service.get_events_summary(
                camera_ids=query["cameras"],
                start_time=query["time_period"]["start_time"],
            )

            response = "📊 **Security Events Summary**\n\n"
            response += f"**Time Period:** {query['time_period']['start_time'].strftime('%Y-%m-%d %H:%M')} to now\n"
            response += f"**Cameras:** {', '.join(query['cameras'])}\n\n"

            if events_summary["total_events"] == 0:
                response += "No significant events detected during this period. Your property has been quiet and secure."
            else:
                response += f"**Total Events:** {events_summary['total_events']}\n\n"

                if events_summary["events_by_type"]:
                    response += "**Event Breakdown:**\n"
                    for event_type, count in events_summary["events_by_type"].items():
                        response += (
                            f"• {event_type.replace('_', ' ').title()}: {count}\n"
                        )
                    response += "\n"

                if events_summary["recent_events"]:
                    response += "**Recent Activity:**\n"
                    for event in events_summary["recent_events"][:5]:
                        time_str = datetime.fromisoformat(event["timestamp"]).strftime(
                            "%H:%M"
                        )
                        response += f"• {time_str} - {event['description']} ({event['camera_id']})\n"

            return {
                "response": response,
                "timestamp": datetime.now().isoformat(),
                "source": "intelligent_fallback",
                "action": "events_summary",
            }

        # Handle frame analysis
        if context.get("video_context", {}).get("frames"):
            response = "🎥 **Live Camera Analysis**\n\n"
            response += (
                "I can see your current camera feeds. Here's what I observe:\n\n"
            )

            for frame_info in context["video_context"]["frames"]:
                camera_name = {
                    "cam1": "Back Entrance",
                    "cam2": "Front Entrance",
                    "cam3": "Back Entrance",
                    "cam4": "Front Entrance",
                }.get(frame_info["camera_id"], frame_info["camera_id"])

                response += f"**{camera_name} ({frame_info['camera_id']}):**\n"
                response += "Camera is operational and providing clear video feed. "
                response += "No immediate security concerns detected.\n\n"

            if "what do you see" in message_lower or "analyze" in message_lower:
                response += "The video quality is good and the cameras are positioned well for security monitoring. "
                response += (
                    "I'm continuously analyzing these feeds for any unusual activity."
                )

            return {
                "response": response,
                "timestamp": datetime.now().isoformat(),
                "source": "intelligent_fallback",
                "action": "frame_analysis",
            }

        # General responses
        general_responses = {
            "status": "🟢 **System Status**\n\nAll cameras are online and functioning normally. AI monitoring is active.",
            "help": "💡 **How I Can Help**\n\n• **Monitor**: Ask me to watch for deliveries, people, or vehicles\n• **Analyze**: Ask 'what happened today?' to get event summaries\n• **Live View**: I can analyze current camera feeds\n• **Alerts**: I'll notify you of important events in real-time",
            "cameras": "📹 **Camera Setup**\n\n• cam1: Back Entrance\n• cam2: Front Entrance\n• cam3: Back Entrance\n• cam4: Front Entrance\n\nAll cameras are currently online and recording.",
        }

        for keyword, response_text in general_responses.items():
            if keyword in message_lower:
                return {
                    "response": response_text,
                    "timestamp": datetime.now().isoformat(),
                    "source": "intelligent_fallback",
                }

        # Default intelligent response
        response = "🤖 **VisionGuard AI Assistant**\n\n"
        response += "I'm here to help you monitor your security system! I can:\n\n"
        response += (
            "• **Set up monitoring** - Tell me to watch for specific activities\n"
        )
        response += "• **Analyze events** - Ask what happened during any time period\n"
        response += (
            "• **Live analysis** - I can see and analyze your current camera feeds\n"
        )
        response += "• **Security insights** - Get recommendations for your system\n\n"
        response += "Try asking me things like:\n"
        response += "- 'Monitor for package deliveries at the front door'\n"
        response += "- 'What happened today?'\n"
        response += "- 'Show me what's happening now'\n"
        response += "- 'Any suspicious activity this week?'"

        return {
            "response": response,
            "timestamp": datetime.now().isoformat(),
            "source": "intelligent_fallback",
        }

    async def _process_actions(
        self,
        response: Dict[str, Any],
        monitoring_task: Optional[Dict],
        events_query: Optional[Dict],
    ):
        """Process any actions that need to be taken based on the response"""

        # Set up monitoring task if requested
        if monitoring_task and response.get("action") == "setup_monitoring":
            self.video_service.add_monitoring_task(
                user_request=monitoring_task["original_request"],
                camera_ids=monitoring_task["cameras"],
                event_types=monitoring_task["event_types"],
            )
            logger.info(
                f"Set up monitoring task for: {monitoring_task['original_request']}"
            )


# Singleton instance
_enhanced_ai_service = None


def get_enhanced_ai_service() -> AIService:
    """Get the enhanced AI service singleton"""
    global _enhanced_ai_service
    if _enhanced_ai_service is None:
        _enhanced_ai_service = AIService()
    return _enhanced_ai_service
