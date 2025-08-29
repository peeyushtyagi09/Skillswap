// backend/models/Friend.models.js
const mongoose = require('mongoose');

const FriendsSchema = new mongoose.Schema(
  {
    users: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: {
        validator: (v) =>
          Array.isArray(v) &&
          v.length === 2 &&
          v[0]?.toString() !== v[1]?.toString(),
        message: 'users must be an array of two distinct user IDs',
      },
    },
  },
  { timestamps: true }
);

// Ensure canonical order [smaller, larger] so the pair is stable
FriendsSchema.pre('save', function (next) {
  if (Array.isArray(this.users) && this.users.length === 2) {
    const [a, b] = this.users;
    const aStr = a.toString();
    const bStr = b.toString();
    this.users = aStr < bStr ? [a, b] : [b, a];
  }
  next();
});

// Unique index on the ordered pair (prevents duplicate friendships)
FriendsSchema.index({ 'users.0': 1, 'users.1': 1 }, { unique: true });

module.exports = mongoose.model('Friend', FriendsSchema);