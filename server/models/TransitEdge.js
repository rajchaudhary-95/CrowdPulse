const mongoose = require('mongoose');

const TransitEdgeSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "edge-metro-north"
    name: { type: String, required: true },
    fromZoneId: { type: String, ref: 'Zone', required: true },
    toZoneId: { type: String, ref: 'Zone', required: true },
    mode: {
      type: String,
      enum: ['metro', 'shuttle_bus', 'pedestrian_walkway', 'rideshare'],
      default: 'metro',
    },
    distanceMeters: { type: Number, required: true },
    baseTravelTimeMinutes: { type: Number, required: true },
    maxThroughputPerHour: { type: Number, required: true },
    pathCoordinates: [{ type: Array }], // [[lat, lng], ...] for Leaflet polyline
    liveStatus: {
      currentFlowPerHour: { type: Number, default: 0 },
      currentTravelTimeMinutes: { type: Number, default: 10 },
      utilizationRate: { type: Number, default: 0.0 }, // flow / maxThroughput
      congestionLevel: {
        type: String,
        enum: ['free_flow', 'moderate', 'heavy', 'gridlock'],
        default: 'free_flow',
      },
      isActive: { type: Boolean, default: true },
      shuttlesAssigned: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransitEdge', TransitEdgeSchema);
