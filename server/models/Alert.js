const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    zoneId: { type: String, ref: 'Zone', required: true },
    zoneName: { type: String },
    type: {
      type: String,
      enum: ['capacity_breach', 'transit_bottleneck', 'forecast_surge', 'evacuation_risk'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metrics: {
      currentVal: { type: Number },
      thresholdVal: { type: Number },
      unit: { type: String, default: '%' },
    },
    recommendedAction: { type: String },
    isAcknowledged: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', AlertSchema);
