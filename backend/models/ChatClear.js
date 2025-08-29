// backend/models/ChatClear.js
const mongoose = require('mongoose');

const chatClearSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    peerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clearedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Ensure one marker per (user, peer)
chatClearSchema.index({ userId: 1, peerId: 1 }, { unique: true });

module.exports = mongoose.model('ChatClear', chatClearSchema);