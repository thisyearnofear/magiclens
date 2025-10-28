import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { EnhancedOverlayData } from '@/types/enhanced-overlay-types';

// Types for real-time collaboration
interface UserPresence {
  userId: string;
  username: string;
  color: string;
  cursorPosition?: { x: number; y: number };
  selectedOverlayId?: string;
  lastActive: number; // timestamp
}

interface OverlayOperation {
  id: string; // Operation ID for OT
  type: 'create' | 'update' | 'delete' | 'transform' | 'select';
  userId: string;
  timestamp: number;
  data: any;
  overlayId?: string;
}

interface PoseAnalysisUpdate {
  videoId: string;
  poseAnalysis: any; // Pose analysis results
  smartPlacement?: any; // Smart placement suggestions
  userId: string;
  timestamp: number;
}

interface CollaborationState {
  sessionId: string;
  users: UserPresence[];
  operations: OverlayOperation[];
  isSynced: boolean;
}

// Hook for real-time collaboration
export const useRealtimeCollaboration = (
  collaborationId: string,
  userId: string,
  username: string,
  initialOverlays: EnhancedOverlayData[],
  onOverlaysUpdate: (overlays: EnhancedOverlayData[]) => void,
  onPoseAnalysisUpdate?: (update: PoseAnalysisUpdate) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [isSynced, setIsSynced] = useState(false);
  const [currentPoseAnalysis, setCurrentPoseAnalysis] = useState<PoseAnalysisUpdate | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const operationsRef = useRef<OverlayOperation[]>([]);
  const localUserId = useRef(userId);
  const localUsername = useRef(username);
  
  // Colors for user cursors
  const userColors = useRef([
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFBE0B', '#FB5607', 
    '#8338EC', '#3A86FF', '#06D6A0', '#118AB2', '#073B4C'
  ]);
  
  // Initialize socket connection
  useEffect(() => {
    if (!collaborationId) return;
    
    // Connect to collaboration server
    const socket = io(process.env.REACT_APP_COLLABORATION_SERVER || 'http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;
    
    // Join collaboration session
    socket.emit('join-session', {
      sessionId: collaborationId,
      userId,
      username,
    });
    
    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to collaboration server');
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
      setIsConnected(false);
    });
    
    // Handle user presence
    socket.on('user-joined', (user: UserPresence) => {
      setUsers(prev => {
        // Filter out existing user if already present
        const filtered = prev.filter(u => u.userId !== user.userId);
        return [...filtered, user];
      });
    });
    
    socket.on('user-left', (userId: string) => {
      setUsers(prev => prev.filter(u => u.userId !== userId));
    });
    
    socket.on('user-update', (user: UserPresence) => {
      setUsers(prev => {
        const filtered = prev.filter(u => u.userId !== user.userId);
        return [...filtered, user];
      });
    });
    
    // Handle overlay operations
    socket.on('operation', (operation: OverlayOperation) => {
      handleRemoteOperation(operation);
    });

    // Handle pose analysis updates
    socket.on('pose-analysis-update', (update: PoseAnalysisUpdate) => {
      setCurrentPoseAnalysis(update);
      if (onPoseAnalysisUpdate) {
        onPoseAnalysisUpdate(update);
      }
    });

    // Handle initial state sync
    socket.on('session-state', (state: CollaborationState) => {
      // Apply initial state
      setIsSynced(true);
      setUsers(state.users);

      // Replay operations in order
      const sortedOps = [...state.operations].sort((a, b) => a.timestamp - b.timestamp);
      operationsRef.current = sortedOps;

      // Apply operations to overlays
      let currentOverlays = [...initialOverlays];
      for (const op of sortedOps) {
        currentOverlays = applyOperation(currentOverlays, op);
      }

      onOverlaysUpdate(currentOverlays);
    });
    
    // Cleanup
    return () => {
      socket.emit('leave-session', {
        sessionId: collaborationId,
        userId,
      });
      socket.disconnect();
    };
  }, [collaborationId, userId, username, initialOverlays]);
  
  // Apply operation to overlays
  const applyOperation = useCallback((
    overlays: EnhancedOverlayData[],
    operation: OverlayOperation
  ): EnhancedOverlayData[] => {
    switch (operation.type) {
      case 'create':
        return [...overlays, operation.data];
        
      case 'update':
        return overlays.map(overlay => 
          overlay.id === operation.overlayId 
            ? { ...overlay, ...operation.data } 
            : overlay
        );
        
      case 'delete':
        return overlays.filter(overlay => overlay.id !== operation.overlayId);
        
      case 'transform':
        return overlays.map(overlay => 
          overlay.id === operation.overlayId 
            ? { ...overlay, position: { ...overlay.position, ...operation.data } } 
            : overlay
        );
        
      case 'select':
        // Selection doesn't change overlays, just user state
        return overlays;
        
      default:
        return overlays;
    }
  }, []);
  
  // Handle remote operations
  const handleRemoteOperation = useCallback((operation: OverlayOperation) => {
    // Add to operations log
    operationsRef.current = [...operationsRef.current, operation];
    
    // Apply to current state
    onOverlaysUpdate(prev => applyOperation([...prev], operation));
  }, [applyOperation, onOverlaysUpdate]);
  
  // Send operation to other users
  const sendOperation = useCallback((
    type: OverlayOperation['type'],
    data: any,
    overlayId?: string
  ) => {
    if (!socketRef.current || !isConnected) return;
    
    const operation: OverlayOperation = {
      id: uuidv4(),
      type,
      userId: localUserId.current,
      timestamp: Date.now(),
      data,
      overlayId,
    };
    
    socketRef.current.emit('operation', {
      sessionId: collaborationId,
      operation,
    });
  }, [collaborationId, isConnected]);
  
  // Update user presence
  const updateUserPresence = useCallback((presence: Partial<UserPresence>) => {
    if (!socketRef.current || !isConnected) return;
    
    const userUpdate: UserPresence = {
      userId: localUserId.current,
      username: localUsername.current,
      color: userColors.current[Math.floor(Math.random() * userColors.current.length)],
      lastActive: Date.now(),
      ...presence,
    };
    
    socketRef.current.emit('user-update', {
      sessionId: collaborationId,
      user: userUpdate,
    });
  }, [collaborationId, isConnected]);
  
  // Wrapper functions for overlay operations
  const createOverlay = useCallback((overlay: EnhancedOverlayData) => {
    sendOperation('create', overlay);
  }, [sendOperation]);
  
  const updateOverlay = useCallback((overlayId: string, updates: Partial<EnhancedOverlayData>) => {
    sendOperation('update', updates, overlayId);
  }, [sendOperation]);
  
  const deleteOverlay = useCallback((overlayId: string) => {
    sendOperation('delete', {}, overlayId);
  }, [sendOperation]);
  
  const transformOverlay = useCallback((overlayId: string, transformData: any) => {
    sendOperation('transform', transformData, overlayId);
  }, [sendOperation]);
  
  const selectOverlay = useCallback((overlayId: string | null) => {
    updateUserPresence({ selectedOverlayId: overlayId || undefined });
    sendOperation('select', { selectedOverlayId: overlayId }, overlayId || undefined);
  }, [sendOperation, updateUserPresence]);
  
  const updateCursorPosition = useCallback((x: number, y: number) => {
    updateUserPresence({ cursorPosition: { x, y } });
  }, [updateUserPresence]);

  // Broadcast pose analysis updates to all users in session
  const broadcastPoseAnalysis = useCallback((
    videoId: string,
    poseAnalysis: any,
    smartPlacement?: any
  ) => {
    if (!socketRef.current || !isConnected) return;

    const update: PoseAnalysisUpdate = {
      videoId,
      poseAnalysis,
      smartPlacement,
      userId: localUserId.current,
      timestamp: Date.now(),
    };

    socketRef.current.emit('pose-analysis-update', {
      sessionId: collaborationId,
      update,
    });

    // Update local state
    setCurrentPoseAnalysis(update);
  }, [collaborationId, isConnected]);
  
  // Conflict resolution for simultaneous edits
  const resolveConflict = useCallback((
    localOp: OverlayOperation,
    remoteOp: OverlayOperation
  ): OverlayOperation | null => {
    // Simple conflict resolution: last writer wins
    // In a real implementation, this would use Operational Transformation
    if (localOp.timestamp > remoteOp.timestamp) {
      return localOp;
    }
    return remoteOp;
  }, []);
  
  return {
    isConnected,
    isSynced,
    users,
    currentPoseAnalysis,
    createOverlay,
    updateOverlay,
    deleteOverlay,
    transformOverlay,
    selectOverlay,
    updateCursorPosition,
    broadcastPoseAnalysis,
  };
};