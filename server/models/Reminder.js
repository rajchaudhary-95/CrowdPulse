const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userIdentifier: { type: String, required: true }, // session ID or user email
    title: { type: String, required: true },
    targetTime: { type: Date, required: true },
    reminderType: {
      type: String,
      enum: ['egress', 'event', 'concession', 'general'],
      default: 'egress',
    },
    isTriggered: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reminder', ReminderSchema);
