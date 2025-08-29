// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['friend_request'] },
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] },
    meta: { type: Object, default: {} }, // Optional extra data
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);