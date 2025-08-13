const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending', index: true },
  },
  { timestamps: true }
);

friendRequestSchema.index({ from: 1, to: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
