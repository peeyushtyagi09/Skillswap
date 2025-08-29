const mongoose = require('mongoose');

// Message schema for 1 : 1 chat between friends
// Supports text and optimals attachment metadata stored via storage service.

const messageSchema = new mongoose.Schema({
    senderId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    receiverId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    context: {type: String, default: ""}, // for text
    type: { type: String, enum: ["text", "image", "file", "Gif"], default: "text"},
    attachment: {
        url: {type: String, default: null },
        name: { type: String, default: null},
        mimeType: {type: String, default: null},
        size: { type: Number, default: null}
    },
    readAt : {type: Date, default: null }
}, { timestamps: true});

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

// text index scoped by participants for fast chat search
messageSchema.index({
    context: "text",
    senderId: 1,
    receiverId: 1
});

module.exports = mongoose.model('Message', messageSchema);