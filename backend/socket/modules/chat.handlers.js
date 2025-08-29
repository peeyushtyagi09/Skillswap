const Message = require('../../models/Message');
const { areFriends } = require('../../services/friendship');

function roomForUsers(a, b) {
    if (!a || !b) throw new Error('Invalid user IDs for room');
    return `chat:${[a.toString(), b.toString()].sort().join(':')}`;
}

function registerChatHandlers(io, socket) {
    const userId = socket.user._id.toString();
  
    // --- Send message ---
    socket.on("chat:send", async ({ peerId, context }) => {
      try {
        if (!peerId || !context?.trim()) {
          return socket.emit("chat:error", { message: "Invalid message" });
        }
  
        // Save to DB
        const newMsg = await Message.create({
          senderId: userId,
          receiverId: peerId,
          context: context.trim(),
          type: "text"
        });
  
        // Emit back to sender (replace temp message)
        socket.emit("chat:message", newMsg);
  
        // Emit to receiver (if online)
        io.to(`user:${peerId}`).emit("chat:message", newMsg);
  
      } catch (err) {
        console.error("chat:send error:", err);
        socket.emit("chat:error", { message: "Failed to send message" });
      }
    });
  
    // --- Later we can also add media support here ---
  }

module.exports = { registerChatHandlers };