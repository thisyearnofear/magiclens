from typing import Dict, List, Set, Optional
from uuid import UUID
import json
from datetime import datetime

# In-memory storage for WebSocket connections
# In production, this would be replaced with Redis or similar
class ConnectionManager:
    """Manages WebSocket connections for real-time collaboration."""
    
    def __init__(self):
        # collaboration_id -> set of user_ids
        self.collaboration_rooms: Dict[str, Set[str]] = {}
        # user_id -> connection info
        self.user_connections: Dict[str, Dict] = {}
        # collaboration_id -> recent activity
        self.collaboration_activity: Dict[str, List[Dict]] = {}
    
    def join_collaboration(self, collaboration_id: str, user_id: str, user_info: Dict):
        """Add user to collaboration room."""
        
        if collaboration_id not in self.collaboration_rooms:
            self.collaboration_rooms[collaboration_id] = set()
        
        self.collaboration_rooms[collaboration_id].add(user_id)
        self.user_connections[user_id] = {
            'collaboration_id': collaboration_id,
            'user_info': user_info,
            'joined_at': datetime.now().isoformat(),
            'last_seen': datetime.now().isoformat()
        }
        
        # Notify other users in the room
        self._broadcast_to_collaboration(
            collaboration_id,
            {
                'type': 'user_joined',
                'user_id': user_id,
                'user_info': user_info,
                'timestamp': datetime.now().isoformat()
            },
            exclude_user=user_id
        )
    
    def leave_collaboration(self, collaboration_id: str, user_id: str):
        """Remove user from collaboration room."""
        
        if collaboration_id in self.collaboration_rooms:
            self.collaboration_rooms[collaboration_id].discard(user_id)
            
            # Clean up empty rooms
            if not self.collaboration_rooms[collaboration_id]:
                del self.collaboration_rooms[collaboration_id]
        
        if user_id in self.user_connections:
            user_info = self.user_connections[user_id]['user_info']
            del self.user_connections[user_id]
            
            # Notify other users
            self._broadcast_to_collaboration(
                collaboration_id,
                {
                    'type': 'user_left',
                    'user_id': user_id,
                    'user_info': user_info,
                    'timestamp': datetime.now().isoformat()
                }
            )
    
    def broadcast_overlay_update(self, collaboration_id: str, user_id: str, overlay_data: Dict):
        """Broadcast overlay position/timing updates to collaboration room."""
        
        message = {
            'type': 'overlay_updated',
            'user_id': user_id,
            'overlay_data': overlay_data,
            'timestamp': datetime.now().isoformat()
        }
        
        self._broadcast_to_collaboration(collaboration_id, message, exclude_user=user_id)
        self._add_to_activity(collaboration_id, message)
    
    def broadcast_cursor_position(self, collaboration_id: str, user_id: str, cursor_data: Dict):
        """Broadcast cursor/selection updates for real-time collaboration."""
        
        message = {
            'type': 'cursor_updated',
            'user_id': user_id,
            'cursor_data': cursor_data,
            'timestamp': datetime.now().isoformat()
        }
        
        self._broadcast_to_collaboration(collaboration_id, message, exclude_user=user_id)
    
    def broadcast_chat_message(self, collaboration_id: str, user_id: str, message_text: str):
        """Broadcast chat messages to collaboration room."""
        
        user_info = self.user_connections.get(user_id, {}).get('user_info', {})
        
        message = {
            'type': 'chat_message',
            'user_id': user_id,
            'user_info': user_info,
            'message': message_text,
            'timestamp': datetime.now().isoformat()
        }
        
        self._broadcast_to_collaboration(collaboration_id, message)
        self._add_to_activity(collaboration_id, message)
    
    def broadcast_render_progress(self, collaboration_id: str, render_data: Dict):
        """Broadcast render progress updates."""
        
        message = {
            'type': 'render_progress',
            'render_data': render_data,
            'timestamp': datetime.now().isoformat()
        }
        
        self._broadcast_to_collaboration(collaboration_id, message)
    
    def get_collaboration_users(self, collaboration_id: str) -> List[Dict]:
        """Get list of users currently in collaboration room."""
        
        if collaboration_id not in self.collaboration_rooms:
            return []
        
        users = []
        for user_id in self.collaboration_rooms[collaboration_id]:
            if user_id in self.user_connections:
                connection_info = self.user_connections[user_id]
                users.append({
                    'user_id': user_id,
                    'user_info': connection_info['user_info'],
                    'joined_at': connection_info['joined_at'],
                    'last_seen': connection_info['last_seen']
                })
        
        return users
    
    def get_recent_activity(self, collaboration_id: str, limit: int = 50) -> List[Dict]:
        """Get recent activity for a collaboration."""
        
        activity = self.collaboration_activity.get(collaboration_id, [])
        return activity[-limit:] if activity else []
    
    def update_user_presence(self, user_id: str):
        """Update user's last seen timestamp."""
        
        if user_id in self.user_connections:
            self.user_connections[user_id]['last_seen'] = datetime.now().isoformat()
    
    def _broadcast_to_collaboration(self, collaboration_id: str, message: Dict, exclude_user: Optional[str] = None):
        """Internal method to broadcast message to all users in collaboration."""
        
        if collaboration_id not in self.collaboration_rooms:
            return
        
        # In a real implementation, this would send WebSocket messages
        # For now, we'll just store the message for retrieval
        for user_id in self.collaboration_rooms[collaboration_id]:
            if exclude_user and user_id == exclude_user:
                continue
            
            # TODO: Send actual WebSocket message to user
            print(f"[WebSocket] Broadcasting to user {user_id}: {message['type']}")
    
    def _add_to_activity(self, collaboration_id: str, message: Dict):
        """Add message to collaboration activity log."""
        
        if collaboration_id not in self.collaboration_activity:
            self.collaboration_activity[collaboration_id] = []
        
        self.collaboration_activity[collaboration_id].append(message)
        
        # Keep only last 100 messages per collaboration
        if len(self.collaboration_activity[collaboration_id]) > 100:
            self.collaboration_activity[collaboration_id] = self.collaboration_activity[collaboration_id][-100:]

# Global connection manager instance
connection_manager = ConnectionManager()

# WebSocket endpoint functions that would be used with FastAPI WebSocket routes
def handle_websocket_message(collaboration_id: str, user_id: str, message_data: Dict):
    """Handle incoming WebSocket messages."""
    
    message_type = message_data.get('type')
    
    if message_type == 'overlay_update':
        connection_manager.broadcast_overlay_update(
            collaboration_id, 
            user_id, 
            message_data.get('overlay_data', {})
        )
    
    elif message_type == 'cursor_update':
        connection_manager.broadcast_cursor_position(
            collaboration_id,
            user_id,
            message_data.get('cursor_data', {})
        )
    
    elif message_type == 'chat_message':
        connection_manager.broadcast_chat_message(
            collaboration_id,
            user_id,
            message_data.get('message', '')
        )
    
    elif message_type == 'ping':
        connection_manager.update_user_presence(user_id)
    
    else:
        print(f"Unknown message type: {message_type}")

# REST API functions for collaboration activity
def get_collaboration_presence(collaboration_id: str) -> Dict:
    """Get current users and activity for a collaboration."""
    
    return {
        'collaboration_id': collaboration_id,
        'active_users': connection_manager.get_collaboration_users(collaboration_id),
        'recent_activity': connection_manager.get_recent_activity(collaboration_id, 20),
        'timestamp': datetime.now().isoformat()
    }

def notify_render_progress(collaboration_id: str, render_id: str, progress: float, status: str):
    """Notify collaboration participants of render progress."""
    
    render_data = {
        'render_id': render_id,
        'progress': progress,
        'status': status
    }
    
    connection_manager.broadcast_render_progress(collaboration_id, render_data)