const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const CallSession = require('../models/CallSession');
const Message = require('../models/Message');
const Note = require('../models/Note');

// Post-session summary stub combining notes + last chat messages
router.get('/:id', protect, async function (req, res) {
  const session = await CallSession.findById(req.params.id);
  if (!session) return res.status(404).json({ message: 'Not found' });
  const isMember = session.participants.some(p => p.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ message: 'Forbidden' });
  const note = session.notesId ? await Note.findById(session.notesId) : null;
  const chat = await Message.find({ senderId: { $in: session.participants }, receiverId: { $in: session.participants } }).sort({ createdAt: -1 }).limit(20);
  res.json({
    highlights: chat.map(m => m.text).filter(Boolean).slice(0, 5),
    notes: note?.content || ''
  });
});

module.exports = router;
