const mongoose = require('mongoose');

const ZoneSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g., "zone-stadium-core"
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['venue_cluster', 'transit_hub', 'hospitality', 'commercial', 'buffer'],
      default: 'venue_cluster',
    },
    geoCenter: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    geoBoundary: {
      type: { type: String, enum: ['Polygon', 'Point'], default: 'Polygon' },
      coordinates: { type: Array, required: true }, // [[lat, lng], ...] for Leaflet
    },
    totalCapacity: {
      venue: { type: Number, default: 50000 },
      transit: { type: Number, default: 20000 },
      hospitality: { type: Number, default: 15000 },
    },
    liveMetrics: {
      currentVenueOccupancy: { type: Number, default: 0 },
      currentTransitPressure: { type: Number, default: 0.0 }, // 0.0 to 1.0+
      currentHospitalityOccupancy: { type: Number, default: 0 },
      compositeStressScore: { type: Number, default: 0 }, // 0 to 100
      status: {
        type: String,
        enum: ['normal', 'elevated', 'warning', 'critical'],
        default: 'normal',
      },
      lastUpdated: { type: Date, default: Date.now },
    },
    metadata: {
      accessibilityScore: { type: Number, default: 95 },
      transitConnectedZoneIds: [{ type: String }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Zone', ZoneSchema);
