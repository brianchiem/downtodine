const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD (UTC)
    hours: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.every((h) => Number.isInteger(h) && h >= 0 && h <= 23),
        message: 'hours must be integers between 0 and 23',
      },
    },
  },
  { timestamps: true }
);

availabilitySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
