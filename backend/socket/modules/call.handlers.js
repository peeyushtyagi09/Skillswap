const { areFriends } = require('../../services/friendship');
const CallSession = require('../../models/CallSession');

// In-memory pending call registry: callId -> { from, to, timeout }
// callId format: `${from}:${to}:${Date.now()}` to avoid external deps
const pendingCalls = new Map();

function callRoom(sessionId) { return `call:${sessionId}`; }

async function isParticipant(sessionId, userId) {
  try {
    const session = await CallSession.findById(sessionId).select('participants');
    if (!session) return false;
    return session.participants.some((p) => String(p) === String(userId));
  } catch (e) {
    return false;
  }
}

function newCallId(from, to) {
  return `${String(from)}:${String(to)}:${Date.now()}`;
}

/**
 * Register call-related socket handlers
 * - Presence/eligibility checks
 * - Ringing lifecycle: initiate -> incoming -> accept/reject/timeout
 * - Session joining and WebRTC signaling relays
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {Map<string, Set<string>>} [onlineUsers] Optional online users map (userId -> Set(socketIds))
 */
function registerCallHandlers(io, socket, onlineUsers) {
  /**
   * Step 2: Initiating a call (ringing)
   * Client emits: 'call:initiate' { to }
   * Server:
   *  - Validates friendship
   *  - Checks presence (via onlineUsers map if provided)
   *  - Emits 'call:incoming' to callee's personal room
   *  - Emits 'call:initiated' back to caller with callId
   *  - Schedules auto-timeout -> emits 'call:timeout' to both
   */
  socket.on('call:initiate', async ({ to }) => {
    try {
      const from = socket.user._id.toString();
      const toStr = String(to || '');
      if (!toStr) return;

      // Only allow calling friends
      if (!(await areFriends(socket.user._id, toStr))) {
        socket.emit('call:error', { code: 'NOT_FRIENDS', message: 'Not friends' });
        return;
      }

      // Presence check (if onlineUsers map is provided)
      const isToOnline = onlineUsers ? onlineUsers.has(toStr) : true; // fallback: allow
      if (!isToOnline) {
        socket.emit('call:error', { code: 'USER_OFFLINE', message: 'User offline' });
        return;
      }

      // Create pending call
      const callId = newCallId(from, toStr);
      const timeoutMs = 45000; // 45s default timeout
      const timeout = setTimeout(() => {
        const p = pendingCalls.get(callId);
        if (!p) return;
        io.to(`user:${from}`).emit('call:timeout', { callId });
        io.to(`user:${toStr}`).emit('call:timeout', { callId });
        pendingCalls.delete(callId);
      }, timeoutMs);

      pendingCalls.set(callId, { from, to: toStr, timeout });

      // Notify both sides
      io.to(`user:${toStr}`).emit('call:incoming', { from, callId });
      socket.emit('call:initiated', { callId });
    } catch (err) {
      socket.emit('call:error', { code: 'INITIATE_FAILED', message: 'Failed to initiate call' });
    }
  });

  /**
   * Step 4: Reject ringing call
   * Client (callee or caller cancel) emits: 'call:reject' { callId }
   * Server emits 'call:rejected' to both and clears timeout
   */
  socket.on('call:reject', ({ callId }) => {
    const p = pendingCalls.get(callId);
    if (!p) return;
    const userId = socket.user._id.toString();
    if (userId !== p.to && userId !== p.from) return; // ignore if not related
    clearTimeout(p.timeout);
    pendingCalls.delete(callId);
    io.to(`user:${p.from}`).emit('call:rejected', { callId, by: userId });
    io.to(`user:${p.to}`).emit('call:rejected', { callId, by: userId });
  });

  /**
   * Step 4: Accept ringing call
   * Client (callee) emits: 'call:accept' { callId }
   * Server creates or finds an open CallSession, then emits 'call:accepted' with sessionId
   */
  socket.on('call:accept', async ({ callId }) => {
    const p = pendingCalls.get(callId);
    if (!p) return;
    const userId = socket.user._id.toString();
    if (userId !== p.to) return; // only callee can accept

    clearTimeout(p.timeout);
    pendingCalls.delete(callId);

    // Double-check friendship
    if (!(await areFriends(p.from, p.to))) {
      io.to(`user:${p.from}`).emit('call:error', { code: 'NOT_FRIENDS', message: 'Not friends' });
      io.to(`user:${p.to}`).emit('call:error', { code: 'NOT_FRIENDS', message: 'Not friends' });
      return;
    }

    // Create or reuse an open session for these participants
    let session = await CallSession.findOne({
      participants: { $all: [p.from, p.to], $size: 2 },
      endedAt: { $exists: false }
    });
    if (!session) {
      session = await CallSession.create({ participants: [p.from, p.to], recording: { status: 'none' } });
    }

    const sessionId = session._id.toString();

    // Notify both sides with sessionId so they can join the room and begin WebRTC
    io.to(`user:${p.from}`).emit('call:accepted', { callId, sessionId, peerId: p.to });
    io.to(`user:${p.to}`).emit('call:accepted', { callId, sessionId, peerId: p.from });
  });

  /**
   * Step 1 + Step 6 enforcement: join the call session room
   * Client emits: 'call:join' { sessionId, peerId }
   */
  socket.on('call:join', async ({ sessionId, peerId }) => {
    if (!sessionId || !peerId) return;
    if (!(await areFriends(socket.user._id, peerId))) return;
    if (!(await isParticipant(sessionId, socket.user._id))) return;
    socket.join(callRoom(sessionId));
    io.to(callRoom(sessionId)).emit('call:user-joined', { userId: socket.user._id });
  });

  /**
   * Step 5: WebRTC signaling relays (room-scoped)
   * - Backward-compatible 'call:*' events
   * - Additional 'webrtc:*' synonyms for clarity per roadmap
   */
  const relayEvents = ['offer', 'answer', 'ice-candidate', 'screen:start', 'screen:stop'];

  relayEvents.forEach((evt) => {
    socket.on(`call:${evt}`, async ({ sessionId, payload }) => {
      if (!sessionId) return;
      if (!(await isParticipant(sessionId, socket.user._id))) return;
      io.to(callRoom(sessionId)).emit(`call:${evt}`, { from: socket.user._id, payload });
    });
    // Synonyms with webrtc:* prefix
    if (['offer', 'answer', 'ice-candidate'].includes(evt)) {
      socket.on(`webrtc:${evt}`, async ({ sessionId, payload }) => {
        if (!sessionId) return;
        if (!(await isParticipant(sessionId, socket.user._id))) return;
        io.to(callRoom(sessionId)).emit(`webrtc:${evt}`, { from: socket.user._id, payload });
      });
    }
  });

  /**
   * Step 7: Ending a call
   * Client emits: 'call:end' { sessionId }
   */
  socket.on('call:end', async ({ sessionId }) => {
    if (!sessionId) return;
    if (!(await isParticipant(sessionId, socket.user._id))) return;
    io.to(callRoom(sessionId)).emit('call:end');
  });
}

module.exports = { registerCallHandlers };