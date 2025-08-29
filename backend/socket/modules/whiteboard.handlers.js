const { areFriends } = require('../../services/friendship');
const CallSession = require('../../models/CallSession');

function room(sessionId) {
  return `call:${sessionId}`;
}

async function isParticipant(sessionId, userId) {
  try {
    const session = await CallSession.findById(sessionId).select('participants');
    if (!session) return false;
    return session.participants.some((p) => String(p) === String(userId));
  } catch (e) {
    return false;
  }
}

function registerWhiteboardHandlers(io, socket) {
  // Standardize event names to lowercase, no spaces
  socket.on('whiteboard:stroke', async ({ sessionId, peerId, stroke }) => {
    if (!sessionId || !peerId || !stroke) return;

    // Ensure emitter is a participant in session and is friends with peer
    const ok = await isParticipant(sessionId, socket.user._id);
    if (!ok) return;
    if (!(await areFriends(socket.user._id, peerId))) return;

    io.to(room(sessionId)).emit('whiteboard:stroke', { from: socket.user._id, stroke });
  });

  socket.on('whiteboard:clear', async ({ sessionId, peerId }) => {
    if (!sessionId || !peerId) return;

    const ok = await isParticipant(sessionId, socket.user._id);
    if (!ok) return;
    if (!(await areFriends(socket.user._id, peerId))) return;

    io.to(room(sessionId)).emit('whiteboard:clear', { from: socket.user._id });
  });
}

module.exports = { registerWhiteboardHandlers };
