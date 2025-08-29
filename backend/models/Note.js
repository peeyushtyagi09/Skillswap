const mongoose = require('mongoose');

// Shared note document scoped to a call session. server is the source of truth
// via socket events; we keep a simple text blob versioned with updatedAt.

const NoteSchema = new mongoose.Schema({
    sessionId: {type: mongoose.Schema.Types.ObjectId, ref: 'CallSession', required: true},
    content: {type: String, default: ' '}
}, {timestamps: true})
NoteSchema.index({ sessionId: 1});
module.exports = mongoose.model('note', NoteSchema);