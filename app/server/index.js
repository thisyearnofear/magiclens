import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store sessions
const sessions = new Map();

io.on('connection', (socket) => {
  console.log('a user connected');
  
  // Join session
  socket.on('join-session', (data) => {
    console.log('user joined session', data);
    
    const { sessionId, userId, username } = data;
    
    // Store session data
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        users: [],
        operations: [],
        overlays: []
      });
    }
    
    // Add user to session
    const session = sessions.get(sessionId);
    const userExists = session.users.some(user => user.userId === userId);
    
    if (!userExists) {
      session.users.push({
        userId,
        username,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        lastActive: Date.now(),
        cursorPosition: { x: 0, y: 0 }
      });
    }
    
    // Join the socket room
    socket.join(sessionId);
    
    // Notify other users in the session
    socket.to(sessionId).emit('user-joined', {
      userId,
      username,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      lastActive: Date.now()
    });
    
    // Send current session state to new user
    socket.emit('session-state', {
      sessionId,
      users: session.users,
      operations: session.operations,
      overlays: session.overlays
    });
  });
  
  // Leave session
  socket.on('leave-session', (data) => {
    console.log('user left session', data);
    
    const { sessionId, userId } = data;
    
    // Remove user from session
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.users = session.users.filter(user => user.userId !== userId);
      
      // Notify other users
      socket.to(sessionId).emit('user-left', userId);
    }
  });
  
  // User updates
  socket.on('user-update', (data) => {
    const { sessionId, user } = data;
    
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      const userIndex = session.users.findIndex(u => u.userId === user.userId);
      
      if (userIndex !== -1) {
        session.users[userIndex] = { ...session.users[userIndex], ...user, lastActive: Date.now() };
        
        // Broadcast to others
        socket.to(sessionId).emit('user-update', user);
      }
    }
  });
  
  // Operations
  socket.on('operation', (data) => {
    const { sessionId, operation } = data;

    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);

      // Store operation
      session.operations.push(operation);

      // Broadcast to others
      socket.to(sessionId).emit('operation', operation);
    }
  });

  // Pose analysis updates
  socket.on('pose-analysis-update', (data) => {
    const { sessionId, update } = data;

    if (sessions.has(sessionId)) {
      // Store the latest pose analysis for the session
      const session = sessions.get(sessionId);
      session.poseAnalysis = update;

      // Broadcast to all users in session (including sender for consistency)
      io.to(sessionId).emit('pose-analysis-update', update);
    }
  });
  
  // Overlay updates
  socket.on('overlay-create', (data) => {
    const { sessionId, overlay } = data;
    
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.overlays.push(overlay);
      socket.to(sessionId).emit('overlay-created', overlay);
    }
  });
  
  socket.on('overlay-update', (data) => {
    const { sessionId, overlayId, updates } = data;
    
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      const overlayIndex = session.overlays.findIndex(o => o.id === overlayId);
      
      if (overlayIndex !== -1) {
        session.overlays[overlayIndex] = { 
          ...session.overlays[overlayIndex], 
          ...updates 
        };
        socket.to(sessionId).emit('overlay-updated', { overlayId, updates });
      }
    }
  });
  
  socket.on('overlay-delete', (data) => {
    const { sessionId, overlayId } = data;
    
    if (sessions.has(sessionId)) {
      const session = sessions.get(sessionId);
      session.overlays = session.overlays.filter(o => o.id !== overlayId);
      socket.to(sessionId).emit('overlay-deleted', overlayId);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Collaboration server running at http://localhost:${port}`);
});