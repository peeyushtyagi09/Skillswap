const express = require('express');
const router = express.Router();
const CallRating = require('../models/CallRating');
const { protect } = require('../middleware/authMiddleware');
const { validateCallRating } = require('../middleware/validate');

// Submit a call rating
router.post('/submit', protect, validateCallRating, async (req, res) => {
    try {
        const { sessionId, rating, feedback, callDuration, callQuality, issues } = req.body;
        const userId = req.user._id;

        // Check if rating already exists for this session
        const existingRating = await CallRating.findOne({ sessionId });
        if (existingRating) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rating already submitted for this call session' 
            });
        }

        // Determine caller and receiver based on who is submitting
        const { peerId } = req.body; // This should be the other person in the call
        
        const callRating = new CallRating({
            sessionId,
            callerId: userId,
            receiverId: peerId,
            rating,
            feedback,
            callDuration,
            callQuality,
            issues: issues || ['None']
        });

        await callRating.save();

        res.status(201).json({
            success: true,
            message: 'Call rating submitted successfully',
            data: callRating
        });

    } catch (error) {
        console.error('Error submitting call rating:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get call ratings for a user
router.get('/user/:userId', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const ratings = await CallRating.find({
            $or: [{ callerId: userId }, { receiverId: userId }]
        })
        .populate('callerId', 'Username')
        .populate('receiverId', 'Username')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

        const total = await CallRating.countDocuments({
            $or: [{ callerId: userId }, { receiverId: userId }]
        });

        res.json({
            success: true,
            data: ratings,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (error) {
        console.error('Error fetching call ratings:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Get average rating for a user
router.get('/average/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await CallRating.aggregate([
            {
                $match: {
                    $or: [{ callerId: userId }, { receiverId: userId }]
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalCalls: { $sum: 1 },
                    totalRating: { $sum: '$rating' }
                }
            }
        ]);

        const stats = result[0] || { averageRating: 0, totalCalls: 0, totalRating: 0 };

        res.json({
            success: true,
            data: {
                averageRating: Math.round(stats.averageRating * 10) / 10,
                totalCalls: stats.totalCalls,
                totalRating: stats.totalRating
            }
        });

    } catch (error) {
        console.error('Error fetching average rating:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router;