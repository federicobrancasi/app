# backend/services/video_processor.py
import asyncio
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

import cv2
import numpy as np
from core.config import settings
from services.ai_service import AIService
from services.websocket_manager import get_event_handler, get_websocket_manager

logger = logging.getLogger(__name__)


class CameraStream:
    """Manages individual camera stream processing"""

    def __init__(self, camera_config: Dict[str, Any]):
        self.id = camera_config["id"]
        self.name = camera_config["name"]
        self.url = camera_config["url"]
        self.config = camera_config

        self.cap = None
        self.is_active = False
        self.last_frame = None
        self.last_frame_time = None
        self.frame_count = 0
        self.fps_counter = 0
        self.last_fps_time = time.time()

        # Processing settings
        self.process_interval = settings.FRAME_PROCESSING_INTERVAL
        self.last_processed_time = 0

        # Motion detection
        self.background_subtractor = cv2.createBackgroundSubtractorMOG2(
            detectShadows=True, varThreshold=50
        )
        self.previous_frame = None

        # Status tracking
        self.status = "disconnected"
        self.error_count = 0
        self.last_error = None

    async def connect(self) -> bool:
        """Connect to camera stream"""
        try:
            # For demo purposes, we'll simulate camera connection
            # In production, this would connect to actual RTSP/IP camera
            self.status = "connecting"

            # Simulate connection delay
            await asyncio.sleep(1)

            # Create a dummy video capture for demo
            # In production: self.cap = cv2.VideoCapture(self.url)
            self.cap = self._create_demo_capture()

            if self.cap and self.cap.isOpened():
                self.is_active = True
                self.status = "connected"
                self.error_count = 0
                logger.info(f"Camera {self.id} connected successfully")

                # Notify status change
                event_handler = get_event_handler()
                await event_handler.handle_camera_status_change(
                    self.id, "online", {"message": "Camera connected successfully"}
                )

                return True
            else:
                self.status = "error"
                self.last_error = "Failed to open camera stream"
                logger.error(f"Failed to connect to camera {self.id}")
                return False

        except Exception as e:
            self.status = "error"
            self.last_error = str(e)
            self.error_count += 1
            logger.error(f"Error connecting to camera {self.id}: {e}")
            return False

    def _create_demo_capture(self):
        """Create a demo video capture that generates synthetic frames"""
        # For demo purposes, create a synthetic video source
        # In production, this would be: cv2.VideoCapture(rtsp_url)
        return DemoVideoCapture(self.id)

    async def disconnect(self):
        """Disconnect from camera stream"""
        self.is_active = False

        if self.cap:
            self.cap.release()
            self.cap = None

        self.status = "disconnected"
        logger.info(f"Camera {self.id} disconnected")

        # Notify status change
        event_handler = get_event_handler()
        await event_handler.handle_camera_status_change(
            self.id, "offline", {"message": "Camera disconnected"}
        )

    def read_frame(self) -> Optional[np.ndarray]:
        """Read latest frame from camera"""
        if not self.is_active or not self.cap:
            return None

        try:
            ret, frame = self.cap.read()
            if ret:
                self.last_frame = frame
                self.last_frame_time = time.time()
                self.frame_count += 1
                self._update_fps()
                return frame
            else:
                self.error_count += 1
                if self.error_count > 10:
                    self.status = "error"
                    self.last_error = "Failed to read frame"
                return None

        except Exception as e:
            self.error_count += 1
            self.last_error = str(e)
            logger.error(f"Error reading frame from camera {self.id}: {e}")
            return None

    def _update_fps(self):
        """Update FPS counter"""
        current_time = time.time()
        self.fps_counter += 1

        if current_time - self.last_fps_time >= 1.0:
            self.last_fps_time = current_time
            self.fps_counter = 0

    def detect_motion(self, frame: np.ndarray) -> Dict[str, Any]:
        """Basic motion detection"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            gray = cv2.GaussianBlur(gray, (21, 21), 0)

            # Initialize previous frame
            if self.previous_frame is None:
                self.previous_frame = gray
                return {"motion_detected": False, "motion_areas": []}

            # Calculate difference
            frame_delta = cv2.absdiff(self.previous_frame, gray)
            thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
            thresh = cv2.dilate(thresh, None, iterations=2)

            # Find contours
            contours, _ = cv2.findContours(
                thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            motion_areas = []
            for contour in contours:
                if cv2.contourArea(contour) < 500:  # Filter small movements
                    continue

                x, y, w, h = cv2.boundingRect(contour)
                motion_areas.append(
                    {
                        "x": int(x),
                        "y": int(y),
                        "width": int(w),
                        "height": int(h),
                        "area": int(cv2.contourArea(contour)),
                    }
                )

            # Update previous frame
            self.previous_frame = gray

            return {
                "motion_detected": len(motion_areas) > 0,
                "motion_areas": motion_areas,
                "total_motion_area": sum(area["area"] for area in motion_areas),
            }

        except Exception as e:
            logger.error(f"Error in motion detection for camera {self.id}: {e}")
            return {"motion_detected": False, "motion_areas": [], "error": str(e)}

    def get_status(self) -> Dict[str, Any]:
        """Get current camera status"""
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status,
            "is_active": self.is_active,
            "frame_count": self.frame_count,
            "fps": self.fps_counter,
            "last_frame_time": self.last_frame_time,
            "error_count": self.error_count,
            "last_error": self.last_error,
            "config": self.config,
        }


class DemoVideoCapture:
    """Demo video capture that generates synthetic frames for testing"""

    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        self.frame_count = 0
        self.is_opened = True

        # Create different colored backgrounds for different cameras
        colors = {
            "cam1": (50, 100, 150),  # Blue-ish
            "cam2": (50, 150, 50),  # Green-ish
            "cam3": (150, 50, 150),  # Purple-ish
            "cam4": (150, 100, 50),  # Orange-ish
            "cam5": (150, 50, 50),  # Red-ish
            "cam6": (100, 100, 100),  # Gray-ish
        }
        self.bg_color = colors.get(camera_id, (100, 100, 100))

    def isOpened(self) -> bool:
        return self.is_opened

    def read(self):
        """Generate a synthetic frame"""
        if not self.is_opened:
            return False, None

        # Create a 640x480 frame with moving elements
        frame = np.full((480, 640, 3), self.bg_color, dtype=np.uint8)

        # Add some moving elements to simulate activity
        t = self.frame_count * 0.1

        # Moving circle
        x = int(320 + 200 * np.sin(t))
        y = int(240 + 100 * np.cos(t * 0.7))
        cv2.circle(frame, (x, y), 20, (255, 255, 255), -1)

        # Random noise to simulate real camera
        noise = np.random.randint(0, 20, frame.shape, dtype=np.uint8)
        frame = cv2.add(frame, noise)

        # Add timestamp
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


class VideoProcessor:
    """Main video processing service"""

    def __init__(self):
        self.cameras: Dict[str, CameraStream] = {}
        self.ai_service = AIService()
        self.is_running = False
        self.processing_tasks: Set[asyncio.Task] = set()
        self.frame_queue = asyncio.Queue(maxsize=100)

        # Processing statistics
        self.total_frames_processed = 0
        self.total_ai_analyses = 0
        self.start_time = None

    async def start(self):
        """Start video processing service"""
        if self.is_running:
            return

        self.is_running = True
        self.start_time = time.time()
        logger.info("Video Processor starting...")

        # Start background tasks
        self._start_background_tasks()

        # Load camera configurations and connect
        await self._load_cameras()

        logger.info(f"Video Processor started with {len(self.cameras)} cameras")

    async def stop(self):
        """Stop video processing service"""
        if not self.is_running:
            return

        self.is_running = False
        logger.info("Video Processor stopping...")

        # Cancel all tasks
        for task in self.processing_tasks:
            task.cancel()

        if self.processing_tasks:
            await asyncio.gather(*self.processing_tasks, return_exceptions=True)

        # Disconnect all cameras
        for camera in self.cameras.values():
            await camera.disconnect()

        self.cameras.clear()
        logger.info("Video Processor stopped")

    def _start_background_tasks(self):
        """Start background processing tasks"""
        # Frame processing task
        task = asyncio.create_task(self._frame_processing_loop())
        self.processing_tasks.add(task)
        task.add_done_callback(self.processing_tasks.discard)

        # AI analysis task
        task = asyncio.create_task(self._ai_analysis_loop())
        self.processing_tasks.add(task)
        task.add_done_callback(self.processing_tasks.discard)

        # Status monitoring task
        task = asyncio.create_task(self._status_monitoring_loop())
        self.processing_tasks.add(task)
        task.add_done_callback(self.processing_tasks.discard)

    async def _load_cameras(self):
        """Load camera configurations and connect"""
        # Sample camera configurations - in production, load from database
        camera_configs = [
            {
                "id": "cam1",
                "name": "Front Entrance",
                "location": "Main Building",
                "url": "rtsp://192.168.1.100:554/stream",
                "enabled": True,
                "ai_enabled": True,
                "motion_detection": True,
            },
            {
                "id": "cam2",
                "name": "Parking Lot",
                "location": "Outdoor",
                "url": "rtsp://192.168.1.101:554/stream",
                "enabled": True,
                "ai_enabled": True,
                "motion_detection": True,
            },
            {
                "id": "cam3",
                "name": "Warehouse",
                "location": "Building B",
                "url": "rtsp://192.168.1.102:554/stream",
                "enabled": True,
                "ai_enabled": True,
                "motion_detection": False,
            },
        ]

        for config in camera_configs:
            if config.get("enabled", True):
                await self.add_camera(config)

    async def add_camera(self, camera_config: Dict[str, Any]) -> bool:
        """Add and connect a new camera"""
        camera_id = camera_config["id"]

        if camera_id in self.cameras:
            logger.warning(f"Camera {camera_id} already exists")
            return False

        camera = CameraStream(camera_config)
        success = await camera.connect()

        if success:
            self.cameras[camera_id] = camera

            # Start processing task for this camera
            task = asyncio.create_task(self._camera_processing_loop(camera))
            self.processing_tasks.add(task)
            task.add_done_callback(self.processing_tasks.discard)

            logger.info(f"Camera {camera_id} added and connected")
            return True
        else:
            logger.error(f"Failed to connect camera {camera_id}")
            return False

    async def remove_camera(self, camera_id: str) -> bool:
        """Remove and disconnect a camera"""
        if camera_id not in self.cameras:
            return False

        camera = self.cameras[camera_id]
        await camera.disconnect()
        del self.cameras[camera_id]

        logger.info(f"Camera {camera_id} removed")
        return True

    async def _camera_processing_loop(self, camera: CameraStream):
        """Process frames from a specific camera"""
        logger.info(f"Started processing loop for camera {camera.id}")

        while self.is_running and camera.is_active:
            try:
                frame = camera.read_frame()

                if frame is not None:
                    # Basic motion detection
                    if camera.config.get("motion_detection", False):
                        motion_result = camera.detect_motion(frame)

                        if motion_result["motion_detected"]:
                            # Send motion event through WebSocket
                            event_handler = get_event_handler()
                            await event_handler.handle_motion_detection(
                                camera.id, motion_result
                            )

                    # Queue frame for AI analysis if enabled
                    if camera.config.get("ai_enabled", False):
                        current_time = time.time()
                        if (
                            current_time - camera.last_processed_time
                            >= camera.process_interval
                        ):
                            try:
                                await self.frame_queue.put(
                                    {
                                        "camera_id": camera.id,
                                        "frame": frame.copy(),
                                        "timestamp": current_time,
                                        "camera_info": camera.config,
                                    },
                                    timeout=1.0,
                                )
                                camera.last_processed_time = current_time
                            except asyncio.QueueFull:
                                logger.warning(
                                    f"Frame queue full, dropping frame from {camera.id}"
                                )

                    self.total_frames_processed += 1

                # Control frame rate
                await asyncio.sleep(1.0 / 30)  # Target 30 FPS

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in camera processing loop for {camera.id}: {e}")
                await asyncio.sleep(1)

        logger.info(f"Processing loop ended for camera {camera.id}")

    async def _frame_processing_loop(self):
        """Main frame processing loop"""
        logger.info("Frame processing loop started")

        while self.is_running:
            try:
                # Process frames from queue
                frame_data = await asyncio.wait_for(self.frame_queue.get(), timeout=1.0)

                # In a more sophisticated system, you could do additional
                # preprocessing here before sending to AI analysis

                await asyncio.sleep(0.01)  # Small delay to prevent overwhelming

            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in frame processing loop: {e}")

        logger.info("Frame processing loop ended")

    async def _ai_analysis_loop(self):
        """AI analysis processing loop"""
        logger.info("AI analysis loop started")

        while self.is_running:
            try:
                # Check if there are frames to analyze
                if not self.frame_queue.empty():
                    frame_data = await self.frame_queue.get()

                    # Perform AI analysis
                    analysis_result = await self.ai_service.analyze_frame(
                        frame_data["frame"], frame_data["camera_info"]
                    )

                    # Process AI results
                    if "detected_objects" in analysis_result:
                        objects = analysis_result["detected_objects"]
                        if objects:
                            # Send AI detection event
                            event_handler = get_event_handler()
                            await event_handler.handle_ai_detection(
                                frame_data["camera_id"],
                                {
                                    "type": "ai_analysis",
                                    "objects": objects,
                                    "confidence": analysis_result.get(
                                        "overall_confidence", 0
                                    ),
                                    "alert_level": analysis_result.get(
                                        "alert_level", "low"
                                    ),
                                    "analysis": analysis_result.get(
                                        "overall_assessment", ""
                                    ),
                                },
                            )

                    self.total_ai_analyses += 1

                await asyncio.sleep(0.1)  # Brief pause

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in AI analysis loop: {e}")
                await asyncio.sleep(1)

        logger.info("AI analysis loop ended")

    async def _status_monitoring_loop(self):
        """Monitor camera status and send updates"""
        logger.info("Status monitoring loop started")

        while self.is_running:
            try:
                # Check status of all cameras
                for camera in self.cameras.values():
                    status = camera.get_status()

                    # Send status update through WebSocket
                    ws_manager = get_websocket_manager()
                    await ws_manager.send_camera_update(
                        camera.id,
                        {
                            "type": "status_update",
                            "status": status["status"],
                            "fps": status["fps"],
                            "frame_count": status["frame_count"],
                            "error_count": status["error_count"],
                            "last_error": status["last_error"],
                        },
                    )

                # Send overall system status
                system_status = self.get_system_status()
                await ws_manager.send_system_status(system_status)

                await asyncio.sleep(10)  # Update every 10 seconds

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in status monitoring loop: {e}")
                await asyncio.sleep(5)

        logger.info("Status monitoring loop ended")

    def get_camera_status(self, camera_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific camera"""
        if camera_id in self.cameras:
            return self.cameras[camera_id].get_status()
        return None

    def get_all_cameras_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all cameras"""
        return {
            camera_id: camera.get_status() for camera_id, camera in self.cameras.items()
        }

    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status"""
        camera_statuses = self.get_all_cameras_status()

        online_cameras = sum(
            1 for status in camera_statuses.values() if status["status"] == "connected"
        )
        total_cameras = len(camera_statuses)

        uptime = time.time() - self.start_time if self.start_time else 0

        return {
            "is_running": self.is_running,
            "total_cameras": total_cameras,
            "online_cameras": online_cameras,
            "offline_cameras": total_cameras - online_cameras,
            "total_frames_processed": self.total_frames_processed,
            "total_ai_analyses": self.total_ai_analyses,
            "uptime_seconds": uptime,
            "frame_queue_size": self.frame_queue.qsize(),
            "active_tasks": len(self.processing_tasks),
            "cameras": camera_statuses,
        }

    async def capture_frame(self, camera_id: str) -> Optional[np.ndarray]:
        """Capture a single frame from a specific camera"""
        if camera_id in self.cameras:
            camera = self.cameras[camera_id]
            return camera.read_frame()
        return None

    async def save_frame(
        self, camera_id: str, frame: np.ndarray, filename: str = None
    ) -> str:
        """Save a frame to disk"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{camera_id}_{timestamp}.jpg"

        # Ensure frame storage directory exists
        frame_dir = Path(settings.FRAME_STORAGE_PATH) / camera_id
        frame_dir.mkdir(parents=True, exist_ok=True)

        filepath = frame_dir / filename
        cv2.imwrite(str(filepath), frame)

        logger.info(f"Frame saved: {filepath}")
        return str(filepath)

    async def get_camera_feed_url(self, camera_id: str) -> Optional[str]:
        """Get streaming URL for a camera (for web interface)"""
        if camera_id in self.cameras:
            # In production, this would return the actual streaming URL
            # For demo, return a placeholder
            return f"/api/cameras/{camera_id}/stream"
        return None


# Background task manager for video processing
class VideoProcessingTaskManager:
    """Manages background video processing tasks"""

    def __init__(self, video_processor: VideoProcessor):
        self.video_processor = video_processor
        self.scheduled_tasks: Dict[str, asyncio.Task] = {}
        self.is_running = False

    async def start(self):
        """Start task manager"""
        self.is_running = True
        logger.info("Video Processing Task Manager started")

        # Start periodic tasks
        self._schedule_periodic_tasks()

    async def stop(self):
        """Stop task manager"""
        self.is_running = False

        # Cancel all scheduled tasks
        for task in self.scheduled_tasks.values():
            task.cancel()

        if self.scheduled_tasks:
            await asyncio.gather(*self.scheduled_tasks.values(), return_exceptions=True)

        self.scheduled_tasks.clear()
        logger.info("Video Processing Task Manager stopped")

    def _schedule_periodic_tasks(self):
        """Schedule periodic maintenance tasks"""
        # Cleanup old frames task
        task = asyncio.create_task(self._cleanup_old_frames_task())
        self.scheduled_tasks["cleanup_frames"] = task

        # Generate reports task
        task = asyncio.create_task(self._generate_reports_task())
        self.scheduled_tasks["generate_reports"] = task

        # Health check task
        task = asyncio.create_task(self._health_check_task())
        self.scheduled_tasks["health_check"] = task

    async def _cleanup_old_frames_task(self):
        """Clean up old frame files periodically"""
        while self.is_running:
            try:
                frame_dir = Path(settings.FRAME_STORAGE_PATH)
                if frame_dir.exists():
                    # Remove files older than retention period
                    cutoff_time = time.time() - (7 * 24 * 60 * 60)  # 7 days

                    for file_path in frame_dir.rglob("*.jpg"):
                        if file_path.stat().st_mtime < cutoff_time:
                            file_path.unlink()
                            logger.debug(f"Cleaned up old frame: {file_path}")

                # Wait 24 hours before next cleanup
                await asyncio.sleep(24 * 60 * 60)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
                await asyncio.sleep(60 * 60)  # Retry in 1 hour

    async def _generate_reports_task(self):
        """Generate periodic system reports"""
        while self.is_running:
            try:
                # Generate daily report
                system_status = self.video_processor.get_system_status()

                # Log summary
                logger.info(
                    f"Daily Report - Cameras: {system_status['online_cameras']}/{system_status['total_cameras']}, "
                    f"Frames: {system_status['total_frames_processed']}, "
                    f"AI Analyses: {system_status['total_ai_analyses']}"
                )

                # Send report through WebSocket
                ws_manager = get_websocket_manager()
                await ws_manager.broadcast(
                    {
                        "type": "daily_report",
                        "data": system_status,
                        "timestamp": datetime.now().isoformat(),
                    }
                )

                # Wait 24 hours for next report
                await asyncio.sleep(24 * 60 * 60)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in reports task: {e}")
                await asyncio.sleep(60 * 60)

    async def _health_check_task(self):
        """Perform periodic health checks"""
        while self.is_running:
            try:
                # Check camera health
                for camera_id, camera in self.video_processor.cameras.items():
                    if camera.error_count > 20:
                        logger.warning(
                            f"Camera {camera_id} has high error count: {camera.error_count}"
                        )

                        # Try to reconnect
                        await camera.disconnect()
                        await asyncio.sleep(5)
                        await camera.connect()

                # Check system resources
                system_status = self.video_processor.get_system_status()
                if system_status["frame_queue_size"] > 50:
                    logger.warning(
                        f"Frame queue is getting full: {system_status['frame_queue_size']}"
                    )

                await asyncio.sleep(5 * 60)  # Check every 5 minutes

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in health check task: {e}")
                await asyncio.sleep(60)


# Utility functions
def create_thumbnail(frame: np.ndarray, size: tuple = (160, 120)) -> np.ndarray:
    """Create thumbnail from frame"""
    return cv2.resize(frame, size)


def encode_frame_to_base64(frame: np.ndarray) -> str:
    """Encode frame to base64 string"""
    import base64

    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buffer).decode("utf-8")


def save_video_clip(frames: List[np.ndarray], output_path: str, fps: int = 30) -> bool:
    """Save a list of frames as a video clip"""
    try:
        if not frames:
            return False

        height, width, _ = frames[0].shape
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")

        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        for frame in frames:
            out.write(frame)

        out.release()
        logger.info(f"Video clip saved: {output_path}")
        return True

    except Exception as e:
        logger.error(f"Error saving video clip: {e}")
        return False


# Global instances
video_processor = None
task_manager = None


def get_video_processor() -> VideoProcessor:
    """Get the global video processor instance"""
    global video_processor
    if video_processor is None:
        video_processor = VideoProcessor()
    return video_processor


def get_task_manager() -> VideoProcessingTaskManager:
    """Get the global task manager instance"""
    global task_manager, video_processor
    if task_manager is None:
        if video_processor is None:
            video_processor = VideoProcessor()
        task_manager = VideoProcessingTaskManager(video_processor)
    return task_manager
