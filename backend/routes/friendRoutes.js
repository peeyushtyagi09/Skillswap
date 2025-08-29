const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification.models');
const Friend = require('../models/Friend.models');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const UserProfile = require('../models/UserProfile');

// Helper: canonicalize two ids into sorted array (by string)
function canonicalPair(a, b) {
  const aStr = a.toString();
  const bStr = b.toString();
  return aStr < bStr ? [a, b] : [b, a];
}

// Helper: consistent protocol detection (proxy-friendly)
function getProto(req) {
  return req.headers['x-forwarded-proto'] || req.protocol;
}

/**
 * Send a friend request
 * POST /friend/request
 * body: { targetId }
 */
router.post('/request', protect, async (req, res) => {
  try {
    const { targetId } = req.body;
    const senderId = req.user.id;

    if (!targetId) return res.status(400).json({ message: 'targetId is required' });
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ message: 'Invalid targetId' });
    if (targetId === senderId) return res.status(400).json({ message: 'Cannot friend yourself' });

    const targetUser = await User.findById(targetId).select('_id').lean();
    if (!targetUser) return res.status(404).json({ message: 'Target user not found' });

    // Check if already friends
    const pair = canonicalPair(senderId, targetId);
    const alreadyFriend = await Friend.findOne({ users: pair }).select('_id').lean();
    if (alreadyFriend) return res.status(400).json({ message: 'You are already friends' });

    // Check for existing pending request either direction
    const existing = await Notification.findOne({
      $or: [
        { senderId, receiverId: targetId, type: 'friend_request', status: 'pending' },
        { senderId: targetId, receiverId: senderId, type: 'friend_request', status: 'pending' },
      ],
    }).select('_id').lean();
    if (existing) return res.status(400).json({ message: 'A pending friend request already exists' });

    const notif = await Notification.create({
      senderId,
      receiverId: targetId,
      type: 'friend_request',
      status: 'pending',
    });

    return res.json({ message: 'Friend request sent', notification: notif });
  } catch (err) {
    console.error('POST /friend/request error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Get incoming pending notifications
 * GET /friend/notifications
 */
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({
      receiverId: req.user.id,
      type: 'friend_request',
      status: 'pending',
    })
      .populate('senderId', 'Username email')
      .sort('-createdAt')
      .lean();
    return res.json(notifs);
  } catch (err) {
    console.error('GET /friend/notifications error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Get outgoing pending notifications
 * GET /friend/notifications/outgoing
 */
router.get('/notifications/outgoing', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({
      senderId: req.user.id,
      type: 'friend_request',
      status: 'pending',
    })
      .populate('receiverId', 'Username email')
      .sort('-createdAt')
      .lean();
    return res.json(notifs);
  } catch (err) {
    console.error('GET /friend/notifications/outgoing error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


// Unfriend a user
router.post('/unfriend', protect, async (req, res) => {
    try {
      const { friendId } = req.body;
      const userId = req.user.id; // use .id consistently
  
      if (!friendId) {
        return res.status(400).json({ message: 'friendId is required' });
      }
  
      // Remove references in User model (if you keep friends array there)
      await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
      await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
  
      // Remove Friend doc
      await Friend.deleteOne({ users: { $all: [userId, friendId] } });
  
      // Remove old friend notifications
      await Notification.deleteMany({
        $or: [
          { senderId: userId, receiverId: friendId, type: 'friend_request' },
          { senderId: friendId, receiverId: userId, type: 'friend_request' },
        ],
      });
  
      return res.json({ message: 'Unfriended successfully' });
    } catch (err) {
      console.error('POST /friend/unfriend error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  


/**
 * Cancel outgoing friend request
 * DELETE /friend/request/cancel
 * body: { targetId }
 */
router.delete('/request/cancel', protect, async (req, res) => {
  try {
    const { targetId } = req.body || {};
    const senderId = req.user.id;

    if (!targetId) return res.status(400).json({ message: 'targetId is required' });
    if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ message: 'Invalid targetId' });

    const notif = await Notification.findOneAndDelete({
      senderId,
      receiverId: targetId,
      type: 'friend_request',
      status: 'pending',
    });

    if (!notif) return res.status(404).json({ message: 'No pending request found to cancel' });
    return res.json({ message: 'Friend request cancelled' });
  } catch (err) {
    console.error('DELETE /friend/request/cancel error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Accept friend request
 * POST /friend/accept
 * body: { notifId }
 */
router.post('/accept', protect, async (req, res) => {
    const { notifId } = req.body;
    const userId = req.user.id;
  
    if (!notifId) return res.status(400).json({ message: 'notifId required' });
    if (!mongoose.isValidObjectId(notifId)) return res.status(400).json({ message: 'Invalid notifId' });
  
    try {
      const notif = await Notification.findById(notifId);
      if (!notif) return res.status(404).json({ message: 'Notification not found' });
  
      if (!notif.receiverId) {
        return res.status(400).json({ message: 'Malformed notification: missing receiverId' });
      }
      if (notif.receiverId.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized to accept this request' });
      }
      if (notif.status !== 'pending') {
        return res.status(400).json({ message: 'Request is not pending' });
      }
  
      // Canonicalize and cast to ObjectIds
      const pair = canonicalPair(notif.senderId, notif.receiverId)
        .map(id => new mongoose.Types.ObjectId(id));
  
      console.log("DEBUG accepting pair:", pair);
  
      // Ensure Friend doc exists (use $all so [A,B] == [B,A])
      let friendDoc = await Friend.findOne({ users: { $all: pair } });
      if (!friendDoc) {
        try {
          friendDoc = new Friend({ users: pair });
          await friendDoc.save();
          console.log("DEBUG Friend document created:", friendDoc);
        } catch (saveError) {
          console.error("Friend saveError:", saveError);
          if (saveError.code === 11000) {
            // Duplicate key, fallback to fetch existing
            friendDoc = await Friend.findOne({ users: { $all: pair } });
          } else {
            throw saveError;
          }
        }
      }
  
      // Mark this notification accepted
      notif.status = 'accepted';
      await notif.save();
  
      // Clean up any other pending requests between this pair
      await Notification.updateMany(
        {
          type: 'friend_request',
          status: 'pending',
          $or: [
            { senderId: pair[0], receiverId: pair[1] },
            { senderId: pair[1], receiverId: pair[0] },
          ],
        },
        { $set: { status: 'accepted' } }
      );
  
      // Return the populated friend document
      const verifiedFriend = await Friend.findOne({ users: { $all: pair } })
        .populate('users', 'Username email')
        .lean();
  
      console.log("DEBUG verifiedFriend:", verifiedFriend);
  
      if (!verifiedFriend) {
        return res.status(500).json({ message: 'Friend document could not be created' });
      }
  
      return res.json({
        message: 'Friend request accepted',
        friend: {
          ...verifiedFriend,
          friendedAt: verifiedFriend.createdAt,
        },
      });
    } catch (err) {
      console.error('POST /friend/accept error:', err);
      return res.status(500).json({ message: 'Failed to accept request: ' + err.message });
    }
  });
  
  
  
  

/**
 * Reject friend request
 * POST /friend/reject
 * body: { notifId }
 */
router.post('/reject', protect, async (req, res) => {
  try {
    const { notifId } = req.body;
    const userId = req.user.id;
    if (!notifId) return res.status(400).json({ message: 'notifId required' });
    if (!mongoose.isValidObjectId(notifId)) return res.status(400).json({ message: 'Invalid notifId' });

    const notif = await Notification.findById(notifId);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    if (notif.receiverId.toString() !== userId) return res.status(403).json({ message: 'Not authorized' });
    if (notif.status !== 'pending') return res.status(400).json({ message: 'Not pending' });

    notif.status = 'rejected';
    await notif.save();

    return res.json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error('POST /friend/reject error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Get friends list
 * GET /friend/list
 */
router.get('/list', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await Friend.find({ users: { $in: [userId] } })
      .populate({ path: 'users', select: 'Username email' })
      .lean();

    const friendEmails = friends.flatMap((f) => f.users.map((u) => (u.email || '').toLowerCase()));
    const profiles = await UserProfile.find({
      email: { $in: friendEmails.filter(Boolean) },
    }).lean();

    const profileMap = {};
    profiles.forEach((p) => {
      if (p.email) profileMap[p.email.toLowerCase()] = p;
    });

    const proto = getProto(req);
    const host = req.get('host');

    const friendUsers = friends
      .map((f) => {
        const other = f.users.find((u) => u._id.toString() !== userId.toString());
        if (!other) return null;

        const profile = profileMap[(other.email || '').toLowerCase()];
        let profilePicUrl = null;

        if (profile?.profilePic && profile.profilePic.trim() !== '') {
          if (profile.profilePic.startsWith('http')) {
            profilePicUrl = profile.profilePic;
          } else {
            profilePicUrl = `${proto}://${host}${profile.profilePic}`;
          }
        }

        return {
          id: other._id,
          Username: other.Username,
          email: other.email,
          profilePic: profilePicUrl,
          skills: profile?.skillsHave || [],
          friendedAt: f.createdAt,
        };
      })
      .filter(Boolean);

    return res.json(
      friendUsers.map((f) => ({
        id: f.id,
        Username: f.Username,
        email: f.email,
        profilePic: f.profilePic,
        skills: f.skills,
        friendedAt: f.friendedAt,
      }))
    );
  } catch (err) {
    console.error('GET /friend/list error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;