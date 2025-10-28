import React, { useState, useEffect } from 'react';
import { UserPresence } from '@/hooks/use-realtime-collaboration';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, MousePointer } from 'lucide-react';

interface UserPresenceVisualizerProps {
  users: UserPresence[];
  currentUser: string;
  onUserClick?: (userId: string) => void;
}

export default function UserPresenceVisualizer({
  users,
  currentUser,
  onUserClick
}: UserPresenceVisualizerProps) {
  const [visibleUsers, setVisibleUsers] = useState<UserPresence[]>([]);
  const [cursorPositions, setCursorPositions] = useState<Record<string, { x: number; y: number; timestamp: number }>>({});
  
  // Filter out inactive users (inactive for more than 30 seconds)
  useEffect(() => {
    const now = Date.now();
    const activeUsers = users.filter(user => 
      now - user.lastActive < 30000 // 30 seconds
    );
    
    setVisibleUsers(activeUsers);
    
    // Update cursor positions
    const newPositions: Record<string, { x: number; y: number; timestamp: number }> = {};
    activeUsers.forEach(user => {
      if (user.cursorPosition) {
        newPositions[user.userId] = {
          x: user.cursorPosition.x,
          y: user.cursorPosition.y,
          timestamp: user.lastActive
        };
      }
    });
    setCursorPositions(newPositions);
  }, [users]);
  
  // Clean up old cursor positions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursorPositions(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(userId => {
          if (now - updated[userId].timestamp > 5000) { // Remove after 5 seconds
            delete updated[userId];
          }
        });
        return updated;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative w-full h-full">
      {/* User avatars */}
      <div className="flex flex-wrap gap-2 p-2">
        {visibleUsers.map(user => (
          <div
            key={user.userId}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-all ${
              user.userId === currentUser 
                ? 'bg-yellow-400/20 border border-yellow-400/40' 
                : 'bg-white/10 border border-white/20 hover:bg-white/20'
            }`}
            style={{
              borderColor: user.color,
              borderWidth: user.selectedOverlayId ? '2px' : '1px'
            }}
            onClick={() => onUserClick?.(user.userId)}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-white truncate max-w-[80px]">
              {user.username}
              {user.userId === currentUser && ' (You)'}
            </span>
            {user.selectedOverlayId && (
              <MousePointer className="h-3 w-3 text-yellow-400" />
            )}
          </div>
        ))}
        
        {visibleUsers.length === 0 && (
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <Users className="h-4 w-4" />
            <span>No collaborators online</span>
          </div>
        )}
      </div>
      
      {/* Cursor positions */}
      {Object.entries(cursorPositions).map(([userId, pos]) => {
        const user = visibleUsers.find(u => u.userId === userId);
        if (!user) return null;
        
        return (
          <div
            key={userId}
            className="absolute pointer-events-none z-50"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div 
              className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs shadow-lg"
              style={{ 
                backgroundColor: user.color,
                color: 'white'
              }}
            >
              <MousePointer className="h-3 w-3" />
              <span>{user.username}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}