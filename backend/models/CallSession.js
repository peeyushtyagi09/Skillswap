const mongoose = require('mongoose');

// CallSession stores metadata for a 1:1 call: participants, timing, and recording.
const callSessionSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}],
    startedAt: {type: Date, default: Date.now},
    endedAt: {type: Date, default: null},
    recording: {
        status: {type: String, enum: ['none', 'starting', 'recording', 'processing', 'ready', 'failed'], default: 'none'},
        url: {type: String, default: null },
        provider: {type: String, default: 'none'}
    },
    notesId : {type: mongoose.Schema.Types.ObjectId, ref: 'Note', default: null}
}, { timestamps: true});

callSessionSchema.index({ participants: 1, createdAt: -1 });
module.exports = mongoose.model('CallSession', callSessionSchema);