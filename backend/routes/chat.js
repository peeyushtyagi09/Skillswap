const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');
const { validateBody, Joi } = require('../middleware/validate');
const { areFriends } = require('../services/friendship');
const ChatClear = require('../models/ChatClear');
const upload = require("../upload/multer") 


// Small helper to safely escape regex
function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Serach
router.get('/search', protect, async function(req, res) {
    try{
        const { peerId, q, limit = 30, before } = req.query;
        if(!peerId) return res.status(400).json({ message: 'peerId is required' });
        if(!q || typeof q !== 'string' || q.trim().length === 0) return res.status(400).json({ message: 'q is required' });
        if(q.length > 200) {
            return res.status(400).json({ message: 'q must be less than 200 characters' });
        }
        // Friend check
        const friends = await areFriends(req.user._id, peerId);
        if (!friends) return res.status(403).json({ message: 'You can only search chat with friends' });

        const limitNum = Math.min(Math.max(parseInt(limit) || 30, 1), 50);

        // Base query scoping to this conversition
        const baseQuery = {
            $or: [
                { senderId: req.user._id, receiverId: peerId },
                { senderId: peerId, receiverId: req.user._id }
            ]
        };
        
        // Time Windoe (optional)
        if (before) {
            baseQuery.createdAt = { ...(baseQuery.createdAt || {}), $lt: new Date(before) };
          }

        //   Apply per-user solf-clear marker
        const marker = await ChatClear.findOne({ userId: req.user._id, peerId })
        .select('clearedAt')
        .lean();

      
          if (marker?.clearedAt) {
      baseQuery.createdAt = {
        ...(baseQuery.createdAt || {}),
        $gt: new Date(marker.clearedAt),
      };
    }

    const queryStr = q.trim();

    // Heuristic: Try $text if query seems suitable; else skip to regex
    const suitableForText = queryStr.length >= 3; // text search ignores stop words/1-2 char tokens

    // 1) Try $text search first
    let results = [];
    if (suitableForText) {
      try {
        results = await Message.find(
          { ...baseQuery, $text: { $search: queryStr } },
          {
            score: { $meta: 'textScore' },
            senderId: 1,
            receiverId: 1,
            context: 1,
            type: 1,
            attachment: 1,
            createdAt: 1,
            readAt: 1,
          }
        )
          .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
          .limit(limitNum)
          .lean();
      } catch (e) {
        // Ignore and fallback to regex below
      }
    }

    // 2) Fallback to case-insensitive substring match if no results
    if (!results.length) {
      const safePattern = escapeRegExp(queryStr);
      const regex = new RegExp(safePattern, 'i');
      results = await Message.find({
        ...baseQuery,
        context: { $regex: regex },
      })
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .lean();

      return res.json({ mode: 'regex', results });
    }

    // Text results found
    return res.json({ mode: 'text', results });
  } catch (error) {
    console.error('Chat search error:', error);
    res.status(500).json({ message: 'Failed to search chat' });
  }
});

// Send media message
router.post("/sendMedia", protect, upload.single("file"), async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ message: 'receiverId is required' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded ' });

    // Security: only allow media to friends
    const ok = await areFriends(req.user._id, receiverId);
    if (!ok) return res.status(403).json({ message: 'You can only send media to friends' });

    const type = req.file.mimetype.startsWith('image') ? 'image' : 'file';

    const newMsg = await Message.create({
      senderId: req.user._id,
      receiverId,
      type,
      attachment: {
        url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });

    // Realtime delivery: emit to both sender and receiver just like text messages
    // Event contract: 'chat:message' with the newly created message document
    const io = req.app.get('io');
    if (io) {
      const senderRoom = `user:${req.user._id.toString()}`;
      const receiverRoom = `user:${receiverId.toString()}`;
      io.to(senderRoom).emit('chat:message', newMsg);
      io.to(receiverRoom).emit('chat:message', newMsg);
    }

    // Respond to HTTP caller (sender)
    res.status(200).json(newMsg);
  } catch (error) {
    console.error('Send media error:', error);
    res.status(500).json({ message: 'Failed to send media' });
  }
});

// Get chat history with pagination 

router.get('/history', protect, async function(req, res) {
    try {
      const { peerId, limit = 50, before, after } = req.query;
      if (!peerId) return res.status(400).json({ message: 'peerId is required' });
  
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ message: 'Invalid limit (1-100)' });
      }
  
      // Enforce friendship
      const areFriendsResult = await areFriends(req.user._id, peerId);
      if (!areFriendsResult) {
        return res.status(403).json({ message: 'You can only view chat history with friends' });
      }
  
      // Build query both directions
      const query = {
        $or: [
          { senderId: req.user._id, receiverId: peerId },
          { senderId: peerId, receiverId: req.user._id }
        ]
      };
  
      // Apply createdAt filters (before/after + clearedAt)
      const createdAtFilter = {};
      if (before) createdAtFilter.$lt = new Date(before);
      if (after) createdAtFilter.$gt = new Date(after);
  
      // Apply per-user clear marker
      const marker = await ChatClear.findOne({ userId: req.user._id, peerId })
        .select('clearedAt')
        .lean();
  
      if (marker?.clearedAt) {
        // If an existing $gt is present, keep the later of the two
        const markerDate = new Date(marker.clearedAt);
        if (createdAtFilter.$gt) {
          createdAtFilter.$gt = createdAtFilter.$gt > markerDate ? createdAtFilter.$gt : markerDate;
        } else {
          createdAtFilter.$gt = markerDate;
        }
      }
  
      if (Object.keys(createdAtFilter).length > 0) {
        query.createdAt = createdAtFilter;
      }
  
      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .lean();
  
      // Mark messages as read (only those visible to this user)
      const unreadMessages = messages.filter(m =>
        m.receiverId.toString() === req.user._id.toString() && !m.readAt
      );
  
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(m => m._id);
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { readAt: new Date() } }
        );
      }
  
      res.json(messages.reverse());
    } catch (error) {
      console.error('Chat history error:', error);
      res.status(500).json({ message: 'Failed to load chat history' });
    }
  });
// Mark messages as read
router.post('/read', protect, validateBody(Joi.object({ 
    messageIds: Joi.array().items(Joi.string().required()).min(1).required() 
})), async function (req, res) {
    try {
        const { messageIds } = req.body;
        
        await Message.updateMany(
            { 
                _id: { $in: messageIds }, 
                receiverId: req.user._id 
            },
            { $set: { readAt: new Date() } }
        );
        
        res.json({ success: true, messageIds });
        
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Failed to mark messages as read' });
    }
});

// Get unread message count
router.get('/unread', protect, async function(req, res) {
    try {
        const count = await Message.countDocuments({
            receiverId: req.user._id,
            readAt: null
        });
        
        res.json({ count });
        
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ message: 'Failed to get unread count' });
    }
});

// Delete message (only sender can delete)
router.delete('/message/:messageId', protect, async function(req, res) {
    try {
        const { messageId } = req.params;
        
        const message = await Message.findOne({
            _id: messageId,
            senderId: req.user._id
        });
        
        if (!message) {
            return res.status(404).json({ message: 'Message not found or you cannot delete it' });
        }
        
        await Message.deleteOne({ _id: messageId });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Failed to delete message' });
    }
});

router.post('/clear/:peerId', protect, async function (req, res) {
  try {
    const { peerId } = req.params;
    if (!peerId) return res.status(400).json({ message: 'peerId is required' });

    // Verify friendship
    const ok = await areFriends(req.user._id, peerId);
    if (!ok) return res.status(403).json({ message: 'You can only clear chat with friends' });

    // Upsert clear marker
    const clearedAt = new Date();
    await ChatClear.updateOne(
      { userId: req.user._id, peerId },
      { $set: { clearedAt } },
      { upsert: true }
    );

    // Notify this user's devices to clear UI
    const io = req.app.get('io');
    io.to(`user:${req.user._id.toString()}`).emit('chat:cleared', { peerId: peerId.toString() });

    res.json({ success: true, clearedAt });
  } catch (err) {
    console.error('Clear-for-me error:', err);
    res.status(500).json({ message: 'Failed to clear chat' });
  }
});

module.exports = router;