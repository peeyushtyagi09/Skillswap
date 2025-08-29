function registerPresenceHandlers(io, socket) {
    // Handle user going online
    socket.on('presence:online', () => {
        console.log(`User ${socket.user._id} is online`);
        // Broadcast to all other connected clients
        socket.broadcast.emit('presence:online', socket.user._id);
    });

    // Handle user going offline
    socket.on('presence:offline', () => {
        console.log(`User ${socket.user._id} is offline`);
        // Broadcast to all other connected clients
        socket.broadcast.emit('presence:offline', socket.user._id);
    });

    // Get online users (optional feature)
    socket.on('presence:getOnlineUsers', () => {
        const onlineUsers = Array.from(io.sockets.sockets.values())
            .map(s => s.user?._id)
            .filter(Boolean);
        socket.emit('presence:onlineUsers', onlineUsers);
    });
}

module.exports = { registerPresenceHandlers };