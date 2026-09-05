const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    zoneId: { type: String, ref: 'Zone', required: true },
    category: {
      type: String,
      enum: ['stadium', 'exhibition_hall', 'fan_park', 'conference_center'],
      default: 'stadium',
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    maxCapacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    ingressRatePerMin: { type: Number, default: 350 },
    egressRatePerMin: { type: Number, default: 500 },
    scheduledEvents: [
      {
        eventId: { type: String, required: true },
        name: { type: String, required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        ticketedAttendance: { type: Number, required: true },
        status: {
          type: String,
          enum: ['upcoming', 'in_progress', 'concluded'],
          default: 'upcoming',
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Venue', VenueSchema);
