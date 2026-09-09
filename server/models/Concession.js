const mongoose = require('mongoose');

const ConcessionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['food', 'relax', 'screens', 'restrooms', 'transit'],
      required: true,
    },
    zoneId: { type: String, required: true, ref: 'Zone' },
    locationDescription: { type: String, required: true },
    distanceMetersFromZone: { type: Number, default: 50 },
    baseWaitMinutes: { type: Number, default: 2 },
    capacityRating: { type: String, default: 'normal' },
    isOpen: { type: Boolean, default: true },
    features: [{ type: String }],
    statusNote: { type: String, default: 'Operating smoothly' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Concession', ConcessionSchema);
