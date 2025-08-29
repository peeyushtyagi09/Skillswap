const mongoose = require("mongoose");

const callRatingSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true
        },
        callerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 10
        },
        feedback: {
            type: String,
            maxlength: 500
        },
        callDuration: {
            type: Number, // in seconds
            default: 0
        },
        callQuality: {
            type: String,
            enum: ['Excellent', 'Good', 'Fair', 'Poor'],
            default: 'Good'
        },
        issues: [{
            type: String,
            enum: ['Audio Issues', 'Video Issues', 'Connection Problems', 'Lag', 'None']
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Index for better query performance
callRatingSchema.index({ callerId: 1, receiverId: 1 });
callRatingSchema.index({ sessionId: 1 });

module.exports = mongoose.model("CallRating", callRatingSchema);