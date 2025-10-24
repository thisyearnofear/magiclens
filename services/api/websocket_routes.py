"""WebSocket routes for real-time collaboration features."""
from fastapi import WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from typing import Dict, Optional
import json
from loguru import logger

from core.websocket_service import connection_manager, handle_websocket_message
from core.auth import verify_access_token
from core.user import User


async def get_current_user_ws(websocket: WebSocket, token: str) -> Optional[User]:
    """Get current user from JWT token for WebSocket connection."""
    from core.auth import get_current_user_from_token
    
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    
    user = get_current_user_from_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    
    return user


class WebSocketManager:
    """Manages active WebSocket connections."""
    
    def __init__(self):
        # websocket -> user_id mapping
        self.active_connections: Dict[WebSocket, str] = {}
        # user_id -> websocket mapping
        self.user_websockets: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str, collaboration_id: str, user_info: Dict):
        """Accept WebSocket connection and register user."""
        await websocket.accept()
        
        self.active_connections[websocket] = user_id
        self.user_websockets[user_id] = websocket
        
        # Join collaboration room in connection manager
        connection_manager.join_collaboration(collaboration_id, user_id, user_info)
        
        logger.info(f"User {user_id} connected to collaboration {collaboration_id}")
    
    async def disconnect(self, websocket: WebSocket, collaboration_id: str):
        """Remove WebSocket connection and notify others."""
        user_id = self.active_connections.get(websocket)
        
        if user_id:
            # Leave collaboration room
            connection_manager.leave_collaboration(collaboration_id, user_id)
            
            # Clean up mappings
            if websocket in self.active_connections:
                del self.active_connections[websocket]
            if user_id in self.user_websockets:
                del self.user_websockets[user_id]
            
            logger.info(f"User {user_id} disconnected from collaboration {collaboration_id}")
    
    async def send_personal_message(self, message: Dict, websocket: WebSocket):
        """Send message to specific WebSocket connection."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
    
    async def broadcast_to_collaboration(self, collaboration_id: str, message: Dict, exclude_user: Optional[str] = None):
        """Broadcast message to all users in collaboration."""
        # Get all users in the collaboration
        users = connection_manager.get_collaboration_users(collaboration_id)
        
        for user in users:
            user_id = user['user_id']
            
            # Skip excluded user
            if exclude_user and user_id == exclude_user:
                continue
            
            # Send to user's websocket if connected
            if user_id in self.user_websockets:
                websocket = self.user_websockets[user_id]
                await self.send_personal_message(message, websocket)
    
    async def send_to_user(self, user_id: str, message: Dict):
        """Send message to specific user."""
        if user_id in self.user_websockets:
            websocket = self.user_websockets[user_id]
            await self.send_personal_message(message, websocket)


# Global WebSocket manager instance
ws_manager = WebSocketManager()


# Override the connection manager's broadcast method to use actual WebSockets
def _broadcast_with_websockets(collaboration_id: str, message: Dict, exclude_user: Optional[str] = None):
    """Enhanced broadcast that uses actual WebSocket connections."""
    import asyncio
    
    # Create task to broadcast via WebSockets
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.create_task(ws_manager.broadcast_to_collaboration(collaboration_id, message, exclude_user))
    else:
        # Fallback to sync behavior
        logger.warning("Event loop not running, cannot broadcast WebSocket message")


# Monkey patch the connection manager to use WebSockets
connection_manager._broadcast_to_collaboration = _broadcast_with_websockets


async def websocket_endpoint(
    websocket: WebSocket,
    collaboration_id: str,
    token: str
):
    """
    WebSocket endpoint for real-time collaboration.
    
    Usage:
        ws://localhost:8000/api/ws/{collaboration_id}?token={jwt_token}
    
    Message Types:
        - overlay_update: Update overlay position/properties
        - cursor_update: Update cursor position
        - chat_message: Send chat message
        - ping: Keep-alive heartbeat
    """
    # Authenticate user
    user = await get_current_user_ws(websocket, token)
    if not user:
        return
    
    user_id = str(user.id)
    user_info = {
        'user_id': user_id,
        'wallet_address': user.wallet_address
    }
    
    # Connect to collaboration
    await ws_manager.connect(websocket, user_id, collaboration_id, user_info)
    
    try:
        # Send initial state
        await websocket.send_json({
            'type': 'connected',
            'collaboration_id': collaboration_id,
            'user_id': user_id,
            'users': connection_manager.get_collaboration_users(collaboration_id),
            'recent_activity': connection_manager.get_recent_activity(collaboration_id, limit=20)
        })
        
        # Listen for messages
        while True:
            try:
                # Receive message
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Update presence
                connection_manager.update_user_presence(user_id)
                
                # Handle different message types
                message_type = message_data.get('type')
                
                if message_type == 'ping':
                    # Respond to heartbeat
                    await websocket.send_json({'type': 'pong'})
                
                elif message_type == 'overlay_update':
                    # Broadcast overlay update
                    overlay_data = message_data.get('overlay_data', {})
                    connection_manager.broadcast_overlay_update(
                        collaboration_id,
                        user_id,
                        overlay_data
                    )
                
                elif message_type == 'cursor_update':
                    # Broadcast cursor position
                    cursor_data = message_data.get('cursor_data', {})
                    connection_manager.broadcast_cursor_position(
                        collaboration_id,
                        user_id,
                        cursor_data
                    )
                
                elif message_type == 'chat_message':
                    # Broadcast chat message
                    message_text = message_data.get('message', '')
                    connection_manager.broadcast_chat_message(
                        collaboration_id,
                        user_id,
                        message_text
                    )
                    
                    # Echo back to sender
                    await websocket.send_json({
                        'type': 'chat_message_sent',
                        'message': message_text,
                        'timestamp': message_data.get('timestamp')
                    })
                
                else:
                    # Unknown message type
                    await websocket.send_json({
                        'type': 'error',
                        'message': f'Unknown message type: {message_type}'
                    })
            
            except json.JSONDecodeError:
                await websocket.send_json({
                    'type': 'error',
                    'message': 'Invalid JSON'
                })
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await websocket.send_json({
                    'type': 'error',
                    'message': str(e)
                })
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Clean up connection
        await ws_manager.disconnect(websocket, collaboration_id)


async def get_collaboration_presence(collaboration_id: str) -> Dict:
    """Get current presence info for a collaboration (HTTP endpoint)."""
    return {
        'collaboration_id': collaboration_id,
        'users': connection_manager.get_collaboration_users(collaboration_id),
        'activity': connection_manager.get_recent_activity(collaboration_id, limit=50)
    }
