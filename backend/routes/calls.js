const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { validateBody, Joi } = require('../middleware/validate');

const CallSession = require('../models/CallSession');
const Note = require('../models/Note');

const { areFriends } = require('../services/friendship');

/**
 * POST /           -> create a new call session with a peer
 * GET  /:id        -> fetch a single call session (only if participant)
 * POST /:id/end    -> mark a session as ended (only if participant)
 * GET  /:id/recording -> get recording status for a session (only if participant)
 * POST /:id/notes  -> create/update notes for a session (only if participant)
 */

// Create a session
router.post(
  '/',
  protect,
  validateBody(Joi.object({ peerId: Joi.string().required() })),
  async (req, res, next) => {
    try {
      const { peerId } = req.body;

      // Prevent starting a call with yourself
      if (peerId === String(req.user._id)) {
        return res.status(400).json({ message: 'Cannot start a call with yourself' });
      }

      // Only friends can start a session
      const friends = await areFriends(req.user._id, peerId);
      if (!friends) {
        return res.status(403).json({ message: 'Not friends' });
      }

      // Prevent duplicate open sessions between same users
      const existing = await CallSession.findOne({
        participants: { $all: [req.user._id, peerId], $size: 2 },
        endedAt: { $exists: false }
      });
      if (existing) {
        return res.status(409).json({ message: 'Session already exists', sessionId: existing._id });
      }

      const session = await CallSession.create({
        participants: [req.user._id, peerId],
        recording: { status: 'none' }
      });

      return res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  }
);

// Get a session by id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const session = await CallSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Not found' });
    }

    // Only participants may view
    if (!session.participants.some((p) => p.equals(req.user._id))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(session);
  } catch (err) {
    next(err);
  }
});

// End a session
router.post('/:id/end', protect, async (req, res, next) => {
  try {
    const session = await CallSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (!session.participants.some((p) => p.equals(req.user._id))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (session.endedAt) {
      return res.status(409).json({ message: 'Session already ended' });
    }

    session.endedAt = new Date();
    await session.save();

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Get recording info for a session
router.get('/:id/recording', protect, async (req, res, next) => {
  try {
    const session = await CallSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (!session.participants.some((p) => p.equals(req.user._id))) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(session.recording || { status: 'none' });
  } catch (err) {
    next(err);
  }
});

// Create/Update notes for a session
router.post(
  '/:id/notes',
  protect,
  validateBody(Joi.object({ content: Joi.string().allow('').required() })),
  async (req, res, next) => {
    try {
      const session = await CallSession.findById(req.params.id);
      if (!session) {
        return res.status(404).json({ message: 'Not found' });
      }

      if (!session.participants.some((p) => p.equals(req.user._id))) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      let note;

      if (session.notesId) {
        note = await Note.findByIdAndUpdate(
          session.notesId,
          { content: req.body.content },
          { new: true }
        );
      } else {
        note = await Note.create({
          sessionId: session._id,
          content: req.body.content,
        });
        session.notesId = note._id;
        await session.save();
      }

      return res.json(note);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
