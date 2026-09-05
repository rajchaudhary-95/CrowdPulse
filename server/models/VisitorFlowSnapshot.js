const mongoose = require('mongoose');

const VisitorFlowSnapshotSchema = new mongoose.Schema(
  {
    simulatedTime: { type: Date, required: true },
    globalMetrics: {
      totalActiveVisitors: { type: Number, default: 0 },
      systemAverageStressScore: { type: Number, default: 0 },
      activeAlertsCount: { type: Number, default: 0 },
    },
    zoneSnapshots: [
      {
        zoneId: { type: String, required: true },
        name: { type: String },
        occupancy: { type: Number, default: 0 },
        capacity: { type: Number, default: 1 },
        stressScore: { type: Number, default: 0 },
        status: { type: String, default: 'normal' },
        forecastedStressNext1hr: { type: Number, default: 0 },
      },
    ],
    edgeSnapshots: [
      {
        edgeId: { type: String, required: true },
        flowPerHour: { type: Number, default: 0 },
        utilizationRate: { type: Number, default: 0 },
        congestionLevel: { type: String, default: 'free_flow' },
      },
    ],
  },
  { timestamps: true }
);

// Index for rapid time-series querying
VisitorFlowSnapshotSchema.index({ simulatedTime: -1 });

module.exports = mongoose.model('VisitorFlowSnapshot', VisitorFlowSnapshotSchema);
