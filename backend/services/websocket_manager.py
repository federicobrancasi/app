# backend/services/websocket_manager.py
import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Set

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and real-time communication"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.camera_subscriptions: Dict[str, Set[str]] = (
            {}
        )  # camera_id -> set of client_ids
        self.client_subscriptions: Dict[str, Set[str]] = (
            {}
        )  # client_id -> set of camera_ids

    async def connect(self, client_id: str, websocket: WebSocket):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.client_subscriptions[client_id] = set()

        logger.info(
            f"Client {client_id} connected. Total connections: {len(self.active_connections)}"
        )

        # Send welcome message
        await self.send_to_client(
            client_id,
            {
                "type": "connection_established",
                "client_id": client_id,
                "timestamp": datetime.now().isoformat(),
            },
        )

    async def disconnect(self, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            # Clean up subscriptions
            if client_id in self.client_subscriptions:
                for camera_id in self.client_subscriptions[client_id]:
                    if camera_id in self.camera_subscriptions:
                        self.camera_subscriptions[camera_id].discard(client_id)
                        if not self.camera_subscriptions[camera_id]:
                            del self.camera_subscriptions[camera_id]
                del self.client_subscriptions[client_id]

            # Close connection
            try:
                await self.active_connections[client_id].close()
            except:
                pass
            del self.active_connections[client_id]

            logger.info(
                f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}"
            )

    async def send_to_client(self, client_id: str, message: Dict[str, Any]):
        """Send message to a specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except WebSocketDisconnect:
                await self.disconnect(client_id)
            except Exception as e:
                logger.error(f"Error sending message to client {client_id}: {e}")
                await self.disconnect(client_id)

    async def broadcast(
        self, message: Dict[str, Any], exclude_clients: Set[str] = None
    ):
        """Broadcast message to all connected clients"""
        if exclude_clients is None:
            exclude_clients = set()

        disconnected_clients = []

        for client_id, websocket in self.active_connections.items():
            if client_id not in exclude_clients:
                try:
                    await websocket.send_text(json.dumps(message))
                except WebSocketDisconnect:
                    disconnected_clients.append(client_id)
                except Exception as e:
                    logger.error(f"Error broadcasting to client {client_id}: {e}")
                    disconnected_clients.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected_clients:
            await self.disconnect(client_id)

    async def subscribe_to_camera(self, client_id: str, camera_id: str):
        """Subscribe a client to camera updates"""
        if client_id not in self.client_subscriptions:
            self.client_subscriptions[client_id] = set()

        self.client_subscriptions[client_id].add(camera_id)

        if camera_id not in self.camera_subscriptions:
            self.camera_subscriptions[camera_id] = set()
        self.camera_subscriptions[camera_id].add(client_id)

        logger.info(f"Client {client_id} subscribed to camera {camera_id}")

        await self.send_to_client(
            client_id,
            {
                "type": "subscription_confirmed",
                "camera_id": camera_id,
                "timestamp": datetime.now().isoformat(),
            },
        )

    async def unsubscribe_from_camera(self, client_id: str, camera_id: str):
        """Unsubscribe a client from camera updates"""
        if client_id in self.client_subscriptions:
            self.client_subscriptions[client_id].discard(camera_id)

        if camera_id in self.camera_subscriptions:
            self.camera_subscriptions[camera_id].discard(client_id)
            if not self.camera_subscriptions[camera_id]:
                del self.camera_subscriptions[camera_id]

        logger.info(f"Client {client_id} unsubscribed from camera {camera_id}")

        await self.send_to_client(
            client_id,
            {
                "type": "subscription_removed",
                "camera_id": camera_id,
                "timestamp": datetime.now().isoformat(),
            },
        )

    async def send_camera_update(self, camera_id: str, update: Dict[str, Any]):
        """Send update to all clients subscribed to a specific camera"""
        if camera_id in self.camera_subscriptions:
            message = {
                "type": "camera_update",
                "camera_id": camera_id,
                "data": update,
                "timestamp": datetime.now().isoformat(),
            }

            disconnected_clients = []

            for client_id in self.camera_subscriptions[camera_id]:
                if client_id in self.active_connections:
                    try:
                        await self.active_connections[client_id].send_text(
                            json.dumps(message)
                        )
                    except WebSocketDisconnect:
                        disconnected_clients.append(client_id)
                    except Exception as e:
                        logger.error(
                            f"Error sending camera update to client {client_id}: {e}"
                        )
                        disconnected_clients.append(client_id)

            # Clean up disconnected clients
            for client_id in disconnected_clients:
                await self.disconnect(client_id)

    async def send_alert(self, alert: Dict[str, Any], priority: str = "normal"):
        """Send alert to all connected clients"""
        message = {
            "type": "alert",
            "priority": priority,
            "data": alert,
            "timestamp": datetime.now().isoformat(),
        }

        await self.broadcast(message)
        logger.info(f"Alert broadcasted to {len(self.active_connections)} clients")

    async def send_event_notification(self, event: Dict[str, Any]):
        """Send event notification to subscribed clients"""
        camera_id = event.get("camera_id")

        if camera_id and camera_id in self.camera_subscriptions:
            message = {
                "type": "event_notification",
                "data": event,
                "timestamp": datetime.now().isoformat(),
            }

            for client_id in self.camera_subscriptions[camera_id]:
                await self.send_to_client(client_id, message)

        # Also broadcast high-priority events to all clients
        if event.get("severity") in ["high", "critical"]:
            await self.broadcast(
                {
                    "type": "priority_event",
                    "data": event,
                    "timestamp": datetime.now().isoformat(),
                }
            )

    async def send_system_status(self, status: Dict[str, Any]):
        """Send system status update to all clients"""
        message = {
            "type": "system_status",
            "data": status,
            "timestamp": datetime.now().isoformat(),
        }

        await self.broadcast(message)

    async def disconnect_all(self):
        """Disconnect all clients (for shutdown)"""
        clients_to_disconnect = list(self.active_connections.keys())

        for client_id in clients_to_disconnect:
            await self.disconnect(client_id)

        logger.info("All WebSocket connections closed")

    def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about current connections"""
        return {
            "total_connections": len(self.active_connections),
            "active_subscriptions": sum(
                len(subs) for subs in self.camera_subscriptions.values()
            ),
            "cameras_with_subscribers": len(self.camera_subscriptions),
            "clients": list(self.active_connections.keys()),
        }


class WebSocketManager:
    """High-level WebSocket manager with additional features"""

    def __init__(self):
        self.connection_manager = ConnectionManager()
        self.is_running = False
        self._background_tasks: Set[asyncio.Task] = set()

    async def start(self):
        """Start WebSocket manager background services"""
        if self.is_running:
            return

        self.is_running = True
        logger.info("WebSocket Manager started")

        # Start background tasks
        task = asyncio.create_task(self._heartbeat_task())
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)

    async def stop(self):
        """Stop WebSocket manager and cleanup"""
        if not self.is_running:
            return

        self.is_running = False

        # Cancel background tasks
        for task in self._background_tasks:
            task.cancel()

        # Wait for tasks to complete
        if self._background_tasks:
            await asyncio.gather(*self._background_tasks, return_exceptions=True)

        # Disconnect all clients
        await self.connection_manager.disconnect_all()

        logger.info("WebSocket Manager stopped")

    async def _heartbeat_task(self):
        """Send periodic heartbeat to check connection health"""
        while self.is_running:
            try:
                heartbeat_message = {
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat(),
                    "connections": len(self.connection_manager.active_connections),
                }

                await self.connection_manager.broadcast(heartbeat_message)
                await asyncio.sleep(30)  # Send heartbeat every 30 seconds

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in heartbeat task: {e}")
                await asyncio.sleep(5)

    # Delegate methods to connection manager
    async def connect(self, client_id: str, websocket: WebSocket):
        return await self.connection_manager.connect(client_id, websocket)

    async def disconnect(self, client_id: str):
        return await self.connection_manager.disconnect(client_id)

    async def send_to_client(self, client_id: str, message: Dict[str, Any]):
        return await self.connection_manager.send_to_client(client_id, message)

    async def broadcast(
        self, message: Dict[str, Any], exclude_clients: Set[str] = None
    ):
        return await self.connection_manager.broadcast(message, exclude_clients)

    async def subscribe_to_camera(self, client_id: str, camera_id: str):
        return await self.connection_manager.subscribe_to_camera(client_id, camera_id)

    async def unsubscribe_from_camera(self, client_id: str, camera_id: str):
        return await self.connection_manager.unsubscribe_from_camera(
            client_id, camera_id
        )

    async def send_camera_update(self, camera_id: str, update: Dict[str, Any]):
        return await self.connection_manager.send_camera_update(camera_id, update)

    async def send_alert(self, alert: Dict[str, Any], priority: str = "normal"):
        return await self.connection_manager.send_alert(alert, priority)

    async def send_event_notification(self, event: Dict[str, Any]):
        return await self.connection_manager.send_event_notification(event)

    async def send_system_status(self, status: Dict[str, Any]):
        return await self.connection_manager.send_system_status(status)

    def get_stats(self) -> Dict[str, Any]:
        stats = self.connection_manager.get_connection_stats()
        stats["manager_running"] = self.is_running
        stats["background_tasks"] = len(self._background_tasks)
        return stats


# Event handlers for integration with other services
class EventHandler:
    """Handles events and forwards them through WebSocket"""

    def __init__(self, websocket_manager: WebSocketManager):
        self.ws_manager = websocket_manager

    async def handle_motion_detection(
        self, camera_id: str, detection_data: Dict[str, Any]
    ):
        """Handle motion detection event"""
        event = {
            "id": str(uuid.uuid4()),
            "type": "motion_detected",
            "camera_id": camera_id,
            "severity": "low",
            "data": detection_data,
            "timestamp": datetime.now().isoformat(),
        }

        await self.ws_manager.send_event_notification(event)

    async def handle_ai_detection(self, camera_id: str, detection_data: Dict[str, Any]):
        """Handle AI detection event"""
        # Determine severity based on detection type and confidence
        confidence = detection_data.get("confidence", 0)
        detection_type = detection_data.get("type", "unknown")

        if detection_type in ["person", "vehicle"] and confidence > 90:
            severity = "medium"
        elif detection_type == "weapon" or confidence > 95:
            severity = "high"
        else:
            severity = "low"

        event = {
            "id": str(uuid.uuid4()),
            "type": "ai_detection",
            "camera_id": camera_id,
            "severity": severity,
            "data": detection_data,
            "timestamp": datetime.now().isoformat(),
        }

        await self.ws_manager.send_event_notification(event)

        # Send alert for high-severity detections
        if severity in ["high", "critical"]:
            alert = {
                "title": f"AI Detection Alert - {detection_type.title()}",
                "message": f"High-confidence {detection_type} detected on {camera_id}",
                "camera_id": camera_id,
                "severity": severity,
                "action_required": True,
            }
            await self.ws_manager.send_alert(alert, priority="high")

    async def handle_camera_status_change(
        self, camera_id: str, status: str, details: Dict[str, Any] = None
    ):
        """Handle camera status change"""
        update = {
            "status": status,
            "details": details or {},
            "timestamp": datetime.now().isoformat(),
        }

        await self.ws_manager.send_camera_update(camera_id, update)

        # Send alert for camera failures
        if status in ["offline", "error"]:
            alert = {
                "title": f"Camera {status.title()}",
                "message": f"Camera {camera_id} is now {status}",
                "camera_id": camera_id,
                "severity": "medium",
                "action_required": True,
            }
            await self.ws_manager.send_alert(alert, priority="medium")

    async def handle_system_event(self, event_type: str, data: Dict[str, Any]):
        """Handle system-level events"""
        event = {
            "id": str(uuid.uuid4()),
            "type": event_type,
            "severity": data.get("severity", "low"),
            "data": data,
            "timestamp": datetime.now().isoformat(),
        }

        # Broadcast to all clients for system events
        await self.ws_manager.broadcast({"type": "system_event", "data": event})


# Global instance (will be initialized in main.py)
websocket_manager = None
event_handler = None


def get_websocket_manager() -> WebSocketManager:
    """Get the global WebSocket manager instance"""
    global websocket_manager
    if websocket_manager is None:
        websocket_manager = WebSocketManager()
    return websocket_manager


def get_event_handler() -> EventHandler:
    """Get the global event handler instance"""
    global event_handler, websocket_manager
    if event_handler is None:
        if websocket_manager is None:
            websocket_manager = WebSocketManager()
        event_handler = EventHandler(websocket_manager)
    return event_handler
