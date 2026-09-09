const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    targetZoneId: { type: String, default: null }, // Null means campus-wide
    author: { type: String, default: 'Alegria Safety Operations' },
    isPinned: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);
