const verifyJwtAndGetUser = require('../services/auth').verifyJwtAndGetUser;
const registerChatHandlers = require('./modules/chat.handlers').registerChatHandlers;
const registerCallHandlers = require('./modules/call.handlers').registerCallHandlers;
const registerWhiteboardHandlers = require('./modules/whiteboard.handlers').registerWhiteboardHandlers;
const registerNotesHandlers = require('./modules/notes.handlers').registerNotesHandlers;

// Track online users
let onlineUsers = new Map(); // userId -> socketId

module.exports = function registerSocket(io) {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('unauthorized'));
        const user = await verifyJwtAndGetUser(token);
        if (!user) return next(new Error('unauthorized'));
        socket.user = user;
        next();
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        console.log(`User ${userId} connected with ${socket.id}`);
        
        // Add this socket to user's set
        if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
        onlineUsers.get(userId).add(socket.id);
        
        // Join personal room
        socket.join(`user:${userId}`);

        // Send snapshot of all online users to this client
        socket.emit("users:online", Array.from(onlineUsers.keys()));
        
        // Notify others this user came online
        socket.broadcast.emit("user:online", userId);

        // Register handlers
        registerChatHandlers(io, socket);
        registerCallHandlers(io, socket, onlineUsers);
        registerWhiteboardHandlers(io, socket);
        registerNotesHandlers(io, socket);

        // Allow checking specific user
    socket.on('check:online', (targetUserId) => {
        const isOnline = onlineUsers.has(targetUserId);
        socket.emit('user:status', { userId: targetUserId, online: isOnline });
      });
  
      // Typing indicators
      socket.on("user:typing", ({ to }) => {
        io.to(`user:${to}`).emit("user:typing", { from: userId });
        setTimeout(() => {
          io.to(`user:${to}`).emit("user:typing:stop", { from: userId });
        }, 5000);
      });
  
      // Disconnect handler
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected from ${socket.id}`);
        if (onlineUsers.has(userId)) {
          onlineUsers.get(userId).delete(socket.id);
          if (onlineUsers.get(userId).size === 0) {
            onlineUsers.delete(userId);
            socket.broadcast.emit("user:offline", userId);
          }
        }
      });
    });
};