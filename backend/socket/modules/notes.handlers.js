const Note = require('../../models/Note');
const { areFriends } = require('../../services/friendship');
const CallSession = require('../../models/CallSession');

function room(sessionId) { return `call:${sessionId}`; }

async function isParticipant(sessionId, userId) {
  try {
    const session = await CallSession.findById(sessionId).select('participants');
    if (!session) return false;
    return session.participants.some((p) => String(p) === String(userId));
  } catch (e) {
    return false;
  }
}

function registerNotesHandlers(io, socket) {
  socket.on('notes:update', async ({ sessionId, peerId, content }) => {
    if (!sessionId || !peerId) return;
    if (!(await isParticipant(sessionId, socket.user._id))) return;
    if (!(await areFriends(socket.user._id, peerId))) return;
    // Broadcast to other; persist via REST route for source-of-truth
    io.to(room(sessionId)).emit('notes:update', { from: socket.user._id, content });
  });
}

module.exports = { registerNotesHandlers };