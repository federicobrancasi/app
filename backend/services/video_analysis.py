# backend/services/video_analysis.py
import asyncio
import base64
import logging
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2

logger = logging.getLogger(__name__)


class EventType(Enum):
    PERSON_DETECTED = "person_detected"
    PACKAGE_DELIVERY = "package_delivery"
    VEHICLE_DETECTED = "vehicle_detected"
    MOTION_DETECTED = "motion_detected"
    UNUSUAL_ACTIVITY = "unusual_activity"


@dataclass
class DetectedEvent:
    id: str
    camera_id: str
    event_type: EventType
    timestamp: datetime
    confidence: float
    description: str
    frame_data: Optional[str] = None  # base64 encoded frame
    metadata: Dict[str, Any] = None

    def to_dict(self):
        return {
            **asdict(self),
            "timestamp": self.timestamp.isoformat(),
            "event_type": self.event_type.value,
        }


@dataclass
class MonitoringTask:
    id: str
    user_request: str
    camera_ids: List[str]
    event_types: List[EventType]
    created_at: datetime
    active: bool = True
    last_triggered: Optional[datetime] = None

    def to_dict(self):
        return {
            **asdict(self),
            "created_at": self.created_at.isoformat(),
            "last_triggered": (
                self.last_triggered.isoformat() if self.last_triggered else None
            ),
            "event_types": [et.value for et in self.event_types],
        }


class VideoAnalysisService:
    def __init__(self):
        self.detected_events: List[DetectedEvent] = []
        self.monitoring_tasks: List[MonitoringTask] = []
        self.is_running = False
        self.analysis_tasks = {}

    async def start(self):
        """Start the video analysis service"""
        if self.is_running:
            return

        self.is_running = True
        logger.info("Video analysis service started")

        # Start analysis for each camera
        for camera_id in ["cam1", "cam2", "cam3", "cam4"]:
            task = asyncio.create_task(self._analyze_camera_feed(camera_id))
            self.analysis_tasks[camera_id] = task

    async def stop(self):
        """Stop the video analysis service"""
        self.is_running = False

        # Cancel all analysis tasks
        for task in self.analysis_tasks.values():
            task.cancel()

        await asyncio.gather(*self.analysis_tasks.values(), return_exceptions=True)
        self.analysis_tasks.clear()
        logger.info("Video analysis service stopped")

    async def _analyze_camera_feed(self, camera_id: str):
        """Continuously analyze camera feed for events"""
        video_path = Path(
            f"../frontend/public/videos/{camera_id.replace('cam', 'camera')}.mp4"
        )

        if not video_path.exists():
            logger.warning(f"Video file not found for {camera_id}: {video_path}")
            return

        while self.is_running:
            try:
                cap = cv2.VideoCapture(str(video_path))
                if not cap.isOpened():
                    logger.error(f"Could not open video file for {camera_id}")
                    await asyncio.sleep(10)
                    continue

                frame_count = 0
                while self.is_running and cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        # Loop the video
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                        continue

                    # Analyze every 30th frame (roughly once per second at 30fps)
                    if frame_count % 30 == 0:
                        await self._analyze_frame(camera_id, frame)

                    frame_count += 1
                    await asyncio.sleep(0.033)  # ~30fps

                cap.release()

            except Exception as e:
                logger.error(f"Error analyzing camera {camera_id}: {e}")
                await asyncio.sleep(5)

    async def _analyze_frame(self, camera_id: str, frame):
        """Analyze a single frame for events"""
        try:
            # Simulate AI detection (in real implementation, this would use actual CV models)
            detected_events = await self._detect_events_in_frame(camera_id, frame)

            for event in detected_events:
                await self._process_detected_event(event)

        except Exception as e:
            logger.error(f"Error analyzing frame for {camera_id}: {e}")

    async def _detect_events_in_frame(
        self, camera_id: str, frame
    ) -> List[DetectedEvent]:
        """Detect events in a frame (simulated for demo)"""
        events = []

        # Simulate random event detection for demo
        import random

        if random.random() < 0.001:  # 0.1% chance per frame
            event_types = [
                (EventType.PERSON_DETECTED, "Person detected in frame"),
                (EventType.PACKAGE_DELIVERY, "Package delivery detected"),
                (EventType.VEHICLE_DETECTED, "Vehicle detected"),
                (EventType.MOTION_DETECTED, "Motion detected"),
            ]

            event_type, description = random.choice(event_types)

            # Encode frame as base64
            _, buffer = cv2.imencode(".jpg", frame)
            frame_b64 = base64.b64encode(buffer).decode("utf-8")

            event = DetectedEvent(
                id=f"evt_{datetime.now().timestamp()}",
                camera_id=camera_id,
                event_type=event_type,
                timestamp=datetime.now(),
                confidence=random.uniform(0.7, 0.95),
                description=description,
                frame_data=frame_b64,
                metadata={"frame_size": frame.shape},
            )

            events.append(event)

        return events

    async def _process_detected_event(self, event: DetectedEvent):
        """Process a detected event and check monitoring tasks"""
        # Store the event
        self.detected_events.append(event)

        # Keep only last 1000 events to prevent memory issues
        if len(self.detected_events) > 1000:
            self.detected_events = self.detected_events[-1000:]

        # Check if this event triggers any monitoring tasks
        await self._check_monitoring_tasks(event)

        logger.info(f"Detected event: {event.event_type.value} in {event.camera_id}")

    async def _check_monitoring_tasks(self, event: DetectedEvent):
        """Check if event matches any active monitoring tasks"""
        for task in self.monitoring_tasks:
            if not task.active:
                continue

            # Check if event matches task criteria
            if (
                event.camera_id in task.camera_ids
                and event.event_type in task.event_types
            ):

                # Trigger notification
                await self._trigger_monitoring_alert(task, event)
                task.last_triggered = datetime.now()

    async def _trigger_monitoring_alert(
        self, task: MonitoringTask, event: DetectedEvent
    ):
        """Trigger an alert for a monitoring task"""
        from services.websocket_manager import get_websocket_manager

        alert = {
            "type": "monitoring_alert",
            "task_id": task.id,
            "user_request": task.user_request,
            "event": event.to_dict(),
            "message": f"Alert: {event.description} detected in {event.camera_id} as requested",
            "timestamp": datetime.now().isoformat(),
        }

        ws_manager = get_websocket_manager()
        await ws_manager.broadcast(alert)

        logger.info(f"Triggered monitoring alert for task {task.id}")

    def add_monitoring_task(
        self, user_request: str, camera_ids: List[str], event_types: List[EventType]
    ) -> MonitoringTask:
        """Add a new monitoring task"""
        task = MonitoringTask(
            id=f"task_{datetime.now().timestamp()}",
            user_request=user_request,
            camera_ids=camera_ids,
            event_types=event_types,
            created_at=datetime.now(),
        )

        self.monitoring_tasks.append(task)
        logger.info(f"Added monitoring task: {task.id}")
        return task

    def remove_monitoring_task(self, task_id: str) -> bool:
        """Remove a monitoring task"""
        for i, task in enumerate(self.monitoring_tasks):
            if task.id == task_id:
                del self.monitoring_tasks[i]
                logger.info(f"Removed monitoring task: {task_id}")
                return True
        return False

    def get_events_for_period(
        self,
        camera_ids: List[str] = None,
        start_time: datetime = None,
        end_time: datetime = None,
    ) -> List[DetectedEvent]:
        """Get events for a specific period and cameras"""
        if start_time is None:
            start_time = datetime.now() - timedelta(hours=24)
        if end_time is None:
            end_time = datetime.now()

        filtered_events = []
        for event in self.detected_events:
            # Check time range
            if not (start_time <= event.timestamp <= end_time):
                continue

            # Check camera filter
            if camera_ids and event.camera_id not in camera_ids:
                continue

            filtered_events.append(event)

        return sorted(filtered_events, key=lambda e: e.timestamp, reverse=True)

    def get_events_summary(
        self, camera_ids: List[str] = None, start_time: datetime = None
    ) -> Dict[str, Any]:
        """Get a summary of events for analysis"""
        events = self.get_events_for_period(camera_ids, start_time)

        summary = {
            "total_events": len(events),
            "events_by_type": {},
            "events_by_camera": {},
            "recent_events": [],
            "time_range": {
                "start": start_time.isoformat() if start_time else None,
                "end": datetime.now().isoformat(),
            },
        }

        for event in events:
            # Count by type
            event_type = event.event_type.value
            summary["events_by_type"][event_type] = (
                summary["events_by_type"].get(event_type, 0) + 1
            )

            # Count by camera
            summary["events_by_camera"][event.camera_id] = (
                summary["events_by_camera"].get(event.camera_id, 0) + 1
            )

            # Add to recent events (last 10)
            if len(summary["recent_events"]) < 10:
                summary["recent_events"].append(
                    {
                        "camera_id": event.camera_id,
                        "event_type": event_type,
                        "timestamp": event.timestamp.isoformat(),
                        "description": event.description,
                        "confidence": event.confidence,
                    }
                )

        return summary


# Singleton instance
_video_analysis_service = None


def get_video_analysis_service() -> VideoAnalysisService:
    """Get the video analysis service singleton"""
    global _video_analysis_service
    if _video_analysis_service is None:
        _video_analysis_service = VideoAnalysisService()
    return _video_analysis_service
