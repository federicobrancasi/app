# backend/services/websocket_manager.py
import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, Set

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.camera_subscriptions: Dict[str, Set[str]] = {}
        self.client_subscriptions: Dict[str, Set[str]] = {}

    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.client_subscriptions[client_id] = set()
        logger.info(
            f"Client {client_id} connected. Total: {len(self.active_connections)}"
        )
        await self.send_to_client(
            client_id,
            {
                "type": "connection_established",
                "client_id": client_id,
                "timestamp": datetime.now().isoformat(),
            },
        )

    async def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            for cam in list(self.client_subscriptions.get(client_id, [])):
                await self.unsubscribe_from_camera(client_id, cam)
            try:
                await self.active_connections[client_id].close()
            except:
                pass
            del self.active_connections[client_id]
            logger.info(
                f"Client {client_id} disconnected. Total: {len(self.active_connections)}"
            )

    async def send_to_client(self, client_id: str, message: Dict[str, Any]):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except (WebSocketDisconnect, Exception) as e:
                logger.error(f"Error sending to {client_id}: {e}")
                await self.disconnect(client_id)

    async def broadcast(self, message: Dict[str, Any], exclude: Set[str] = None):
        exclude = exclude or set()
        for cid, ws in list(self.active_connections.items()):
            if cid in exclude:
                continue
            try:
                await ws.send_text(json.dumps(message))
            except (WebSocketDisconnect, Exception) as e:
                logger.error(f"Broadcast error to {cid}: {e}")
                await self.disconnect(cid)

    async def subscribe_to_camera(self, client_id: str, camera_id: str):
        self.client_subscriptions.setdefault(client_id, set()).add(camera_id)
        self.camera_subscriptions.setdefault(camera_id, set()).add(client_id)
        logger.info(f"{client_id} subscribed to {camera_id}")
        await self.send_to_client(
            client_id,
            {
                "type": "subscription_confirmed",
                "camera_id": camera_id,
                "timestamp": datetime.now().isoformat(),
            },
        )

    async def unsubscribe_from_camera(self, client_id: str, camera_id: str):
        self.client_subscriptions.get(client_id, set()).discard(camera_id)
        subs = self.camera_subscriptions.get(camera_id)
        if subs:
            subs.discard(client_id)
            if not subs:
                del self.camera_subscriptions[camera_id]
        logger.info(f"{client_id} unsubscribed from {camera_id}")
        await self.send_to_client(
            client_id,
            {
                "type": "subscription_removed",
                "camera_id": camera_id,
                "timestamp": datetime.now().isoformat(),
            },
        )

    async def send_camera_update(self, camera_id: str, update: Dict[str, Any]):
        clients = self.camera_subscriptions.get(camera_id, set())
        message = {
            "type": "camera_update",
            "camera_id": camera_id,
            "data": update,
            "timestamp": datetime.now().isoformat(),
        }
        for cid in list(clients):
            await self.send_to_client(cid, message)

    async def send_event_notification(self, event: Dict[str, Any]):
        cam = event.get("camera_id")
        if cam in self.camera_subscriptions:
            msg = {
                "type": "event_notification",
                "data": event,
                "timestamp": datetime.now().isoformat(),
            }
            for cid in list(self.camera_subscriptions[cam]):
                await self.send_to_client(cid, msg)
        if event.get("severity") in ["high", "critical"]:
            alert = {
                "type": "priority_event",
                "data": event,
                "timestamp": datetime.now().isoformat(),
            }
            await self.broadcast(alert)

    async def send_system_status(self, status: Dict[str, Any]):
        msg = {
            "type": "system_status",
            "data": status,
            "timestamp": datetime.now().isoformat(),
        }
        await self.broadcast(msg)

    async def disconnect_all(self):
        for cid in list(self.active_connections):
            await self.disconnect(cid)
        logger.info("All WebSocket connections closed")


class WebSocketManager:
    def __init__(self):
        self.conn = ConnectionManager()
        self.is_running = False
        self._tasks: Set[asyncio.Task] = set()

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        task = asyncio.create_task(self._heartbeat())
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    async def stop(self):
        if not self.is_running:
            return
        self.is_running = False
        for t in list(self._tasks):
            t.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        await self.conn.disconnect_all()

    async def _heartbeat(self):
        while self.is_running:
            msg = {
                "type": "heartbeat",
                "timestamp": datetime.now().isoformat(),
                "connections": len(self.conn.active_connections),
            }
            await self.conn.broadcast(msg)
            await asyncio.sleep(30)

    async def connect(self, client_id: str, ws: WebSocket):
        await self.conn.connect(client_id, ws)

    async def disconnect(self, client_id: str):
        await self.conn.disconnect(client_id)

    async def send_to_client(self, client_id: str, message: Dict[str, Any]):
        await self.conn.send_to_client(client_id, message)

    async def broadcast(self, message: Dict[str, Any], exclude: Set[str] = None):
        await self.conn.broadcast(message, exclude)

    async def subscribe_to_camera(self, client_id: str, camera_id: str):
        await self.conn.subscribe_to_camera(client_id, camera_id)

    async def unsubscribe_from_camera(self, client_id: str, camera_id: str):
        await self.conn.unsubscribe_from_camera(client_id, camera_id)

    async def send_camera_update(self, camera_id: str, update: Dict[str, Any]):
        await self.conn.send_camera_update(camera_id, update)

    async def send_event_notification(self, event: Dict[str, Any]):
        await self.conn.send_event_notification(event)

    async def send_system_status(self, status: Dict[str, Any]):
        await self.conn.send_system_status(status)

    async def handle_camera_status_change(
        self, camera_id: str, status: str, data: Dict[str, Any]
    ):
        event = {
            "camera_id": camera_id,
            "type": "camera_status",
            "status": status,
            "data": data,
            "timestamp": datetime.now().isoformat(),
        }
        await self.send_event_notification(event)


_ws_manager = None


def get_websocket_manager():
    global _ws_manager
    if _ws_manager is None:
        _ws_manager = WebSocketManager()
    return _ws_manager


def get_event_handler():
    return get_websocket_manager()
