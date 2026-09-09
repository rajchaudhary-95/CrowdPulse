const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
