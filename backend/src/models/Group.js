const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

GroupSchema.index({ owner: 1, name: 1 });

module.exports = mongoose.model('Group', GroupSchema);
