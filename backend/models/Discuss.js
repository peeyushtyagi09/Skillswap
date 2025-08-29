const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    content: { type: String, maxlength: 1000 }, // removed required:true
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String }, // Allow image upload in comments
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const DiscussSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true, maxlength: 1000 },
    imageUrl: { type: String },
    tags: [{type: String, index: true}],
    votes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comments: [CommentSchema],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    shareCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// ✅ MongoDB text index for searching
DiscussSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model('Discuss', DiscussSchema);