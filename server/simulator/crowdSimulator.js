/**
 * In-Memory Crowd & Transit Simulation Engine
 * Runs the live virtual heartbeat, synchronizes state, and emits real-time WebSocket ticks.
 */

const { mockZones, mockVenues, mockTransitEdges } = require('./mockData');
const { SIMULATION, STRESS_WEIGHTS } = require('../config/thresholds');
const { forecastCrowdPressure } = require('../services/forecasting.service');
const { computeRedistributionPlan } = require('../services/optimization.service');
const { evaluateAlertRules } = require('../services/alert.service');

const ZoneModel = require('../models/Zone');
const VenueModel = require('../models/Venue');
const TransitEdgeModel = require('../models/TransitEdge');
const VisitorFlowSnapshotModel = require('../models/VisitorFlowSnapshot');

class CrowdSimulator {
  constructor(ioInstance = null) {
    this.io = ioInstance;
    this.timer = null;
    this.tickCount = 0;

    // Simulation Clock
    this.simulatedTime = new Date();
    this.simulatedTime.setMinutes(0, 0, 0); // Round to top of hour
    this.isPaused = false;
    this.speedMultiplier = 1;

    // Hot In-Memory State Maps
    this.zones = new Map();
    this.venues = new Map();
    this.transitEdges = new Map();

    // Sliding History for Time Series
    this.recentSnapshots = [];

    // Active Intelligence Results
    this.activeForecast = {};
    this.activeAlerts = [];
    this.activeRecommendations = [];

    // Interactive What-If Scenario Overrides
    this.whatIfOverrides = {
      demandSurgeMultiplier: 1.0,
      eventStartTimeDeltas: {}, // eventId -> minutes offset
      transitCapacityDeltas: {}, // edgeId -> multiplier
    };
  }

  setIo(io) {
    this.io = io;
  }

  /**
   * Seed/hydrate initial state from MongoDB or fallback to mockData.
   */
  async initialize() {
    try {
      let dbZones = await ZoneModel.find().lean();
      let dbVenues = await VenueModel.find().lean();
      let dbEdges = await TransitEdgeModel.find().lean();

      // If database is empty, seed with mockData
      if (!dbZones || dbZones.length === 0) {
        console.log('[Simulator] Hydrating fresh mock seed data into database...');
        await this.seedDatabase();
        dbZones = mockZones;
        dbVenues = mockVenues;
        dbEdges = mockTransitEdges;
      }

      // Populate hot maps
      for (const z of dbZones) this.zones.set(z._id, JSON.parse(JSON.stringify(z)));
      for (const v of dbVenues) this.venues.set(v._id, JSON.parse(JSON.stringify(v)));
      for (const e of dbEdges) this.transitEdges.set(e._id, JSON.parse(JSON.stringify(e)));

      // Perform initial intelligence evaluation
      this.evaluateIntelligence();
      console.log(`[Simulator] Initialized with ${this.zones.size} zones, ${this.venues.size} venues, ${this.transitEdges.size} transit links.`);
    } catch (err) {
      console.warn(`[Simulator Warning] Initializing directly from memory: ${err.message}`);
      for (const z of mockZones) this.zones.set(z._id, JSON.parse(JSON.stringify(z)));
      for (const v of mockVenues) this.venues.set(v._id, JSON.parse(JSON.stringify(v)));
      for (const e of mockTransitEdges) this.transitEdges.set(e._id, JSON.parse(JSON.stringify(e)));
      this.evaluateIntelligence();
    }
  }

  async seedDatabase() {
    try {
      await ZoneModel.deleteMany({});
      await VenueModel.deleteMany({});
      await TransitEdgeModel.deleteMany({});
      await VisitorFlowSnapshotModel.deleteMany({});

      await ZoneModel.insertMany(mockZones);
      await VenueModel.insertMany(mockVenues);
      await TransitEdgeModel.insertMany(mockTransitEdges);
      console.log('[Simulator] MongoDB successfully seeded with mock dataset.');
    } catch (err) {
      console.warn(`[Simulator Seed Notice] Seeding skipped or in-memory only: ${err.message}`);
    }
  }

  start(tickMs = SIMULATION.DEFAULT_TICK_MS) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), tickMs);
    console.log(`[Simulator] Live tick loop running every ${tickMs}ms.`);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    console.log('[Simulator] Live tick loop stopped.');
  }

  /**
   * Main simulation step.
   */
  tick() {
    if (this.isPaused) return;

    this.tickCount++;
    // Advance simulated time (5 virtual minutes per tick * speedMultiplier)
    const stepMinutes = SIMULATION.SIM_TIME_STEP_MINUTES * this.speedMultiplier;
    this.simulatedTime = new Date(this.simulatedTime.getTime() + stepMinutes * 60 * 1000);

    // 1. Update dynamic crowd flow and metrics
    this.advanceCrowdDynamics(stepMinutes);

    // 2. Re-compute pure intelligence (Forecasting -> Optimization -> Alerts)
    this.evaluateIntelligence();

    // 3. Record snapshot in rolling memory window
    const snapshot = this.createSnapshot();
    this.recentSnapshots.push(snapshot);
    if (this.recentSnapshots.length > SIMULATION.HISTORY_WINDOW_SNAPSHOTS) {
      this.recentSnapshots.shift();
    }

    // 4. Periodically persist snapshot to MongoDB
    if (this.tickCount % SIMULATION.DB_FLUSH_INTERVAL_TICKS === 0) {
      this.persistSnapshot(snapshot);
    }

    // 5. Broadcast live state to connected WebSocket clients
    if (this.io) {
      this.io.emit('live:tick', this.getClientPayload());
    }
  }

  /**
   * Simulates dynamic influx, egress, and transit flow variations.
   */
  advanceCrowdDynamics(stepMinutes) {
    const surge = this.whatIfOverrides.demandSurgeMultiplier || 1.0;

    for (const [zoneId, zone] of this.zones) {
      const maxVenueCap = zone.totalCapacity?.venue || 10000;
      let occ = zone.liveMetrics.currentVenueOccupancy;

      // Small organic fluctuation (+/- 1.5% with surge bias)
      const organicFluctuation = (Math.random() - 0.48) * 0.03 * maxVenueCap * surge;
      occ = Math.min(maxVenueCap * 1.1, Math.max(100, Math.round(occ + organicFluctuation)));
      zone.liveMetrics.currentVenueOccupancy = occ;

      // Update transit pressure and composite stress
      const venueRatio = occ / maxVenueCap;
      let transitPressure = zone.liveMetrics.currentTransitPressure;
      // Add slight jitter
      transitPressure = Math.min(1.0, Math.max(0.1, transitPressure + (Math.random() - 0.5) * 0.04));
      zone.liveMetrics.currentTransitPressure = Number(transitPressure.toFixed(2));

      // Calculate composite stress score (0 - 100)
      const stress = Math.min(
        100,
        Math.round(
          venueRatio * 100 * STRESS_WEIGHTS.VENUE_OCCUPANCY +
          transitPressure * 100 * STRESS_WEIGHTS.TRANSIT_PRESSURE +
          (zone.liveMetrics.currentHospitalityOccupancy / (zone.totalCapacity?.hospitality || 1)) * 100 * STRESS_WEIGHTS.HOSPITALITY_OCCUPANCY
        )
      );

      zone.liveMetrics.compositeStressScore = stress;
      if (stress >= 88) zone.liveMetrics.status = 'critical';
      else if (stress >= 75) zone.liveMetrics.status = 'warning';
      else if (stress >= 60) zone.liveMetrics.status = 'elevated';
      else zone.liveMetrics.status = 'normal';

      zone.liveMetrics.lastUpdated = new Date();
    }

    // Update transit edge flow
    for (const [edgeId, edge] of this.transitEdges) {
      const fromZone = this.zones.get(edge.fromZoneId);
      const toZone = this.zones.get(edge.toZoneId);
      const capDelta = this.whatIfOverrides.transitCapacityDeltas?.[edgeId] || 1.0;
      const effectiveMax = edge.maxThroughputPerHour * capDelta;

      if (fromZone && toZone) {
        const fromStress = fromZone.liveMetrics.compositeStressScore;
        const targetFlow = (fromStress / 100) * effectiveMax * surge;
        const currentFlow = Math.round(edge.liveStatus.currentFlowPerHour * 0.7 + targetFlow * 0.3);
        const util = Math.min(1.5, Number((currentFlow / effectiveMax).toFixed(2)));

        edge.liveStatus.currentFlowPerHour = currentFlow;
        edge.liveStatus.utilizationRate = util;
        if (util >= 0.90) edge.liveStatus.congestionLevel = 'gridlock';
        else if (util >= 0.75) edge.liveStatus.congestionLevel = 'heavy';
        else if (util >= 0.50) edge.liveStatus.congestionLevel = 'moderate';
        else edge.liveStatus.congestionLevel = 'free_flow';
      }
    }
  }

  evaluateIntelligence() {
    // 1. Forecast crowd pressure over the next 60 minutes
    this.activeForecast = forecastCrowdPressure({
      snapshots: this.recentSnapshots,
      zones: Array.from(this.zones.values()),
      venues: Array.from(this.venues.values()),
      currentTime: this.simulatedTime,
      horizonMinutes: 60,
      whatIfOverrides: this.whatIfOverrides,
    });

    // 2. Solve LP reallocation recommendations
    this.activeRecommendations = computeRedistributionPlan({
      zones: Array.from(this.zones.values()),
      transitEdges: Array.from(this.transitEdges.values()),
      forecast: this.activeForecast,
    });

    // 3. Evaluate alert rules
    this.activeAlerts = evaluateAlertRules({
      zones: Array.from(this.zones.values()),
      transitEdges: Array.from(this.transitEdges.values()),
      forecast: this.activeForecast,
    });
  }

  createSnapshot() {
    let totalVisitors = 0;
    let sumStress = 0;
    const zoneSnaps = [];

    for (const z of this.zones.values()) {
      totalVisitors += z.liveMetrics.currentVenueOccupancy;
      sumStress += z.liveMetrics.compositeStressScore;
      zoneSnaps.push({
        zoneId: z._id,
        name: z.name,
        occupancy: z.liveMetrics.currentVenueOccupancy,
        capacity: z.totalCapacity?.venue || 1,
        stressScore: z.liveMetrics.compositeStressScore,
        status: z.liveMetrics.status,
        forecastedStressNext1hr: this.activeForecast?.zoneForecasts?.[z._id]?.projectedStress || z.liveMetrics.compositeStressScore,
      });
    }

    const edgeSnaps = Array.from(this.transitEdges.values()).map((e) => ({
      edgeId: e._id,
      flowPerHour: e.liveStatus.currentFlowPerHour,
      utilizationRate: e.liveStatus.utilizationRate,
      congestionLevel: e.liveStatus.congestionLevel,
    }));

    return {
      simulatedTime: this.simulatedTime,
      globalMetrics: {
        totalActiveVisitors: totalVisitors,
        systemAverageStressScore: this.zones.size > 0 ? Math.round(sumStress / this.zones.size) : 0,
        activeAlertsCount: this.activeAlerts.length,
      },
      zoneSnapshots: zoneSnaps,
      edgeSnapshots: edgeSnaps,
    };
  }

  async persistSnapshot(snapshot) {
    try {
      await VisitorFlowSnapshotModel.create(snapshot);
    } catch (err) {
      // Fail-Safe: non-blocking persistence
    }
  }

  updateScenario(overrides = {}) {
    this.whatIfOverrides = {
      ...this.whatIfOverrides,
      ...overrides,
    };
    this.evaluateIntelligence();
    if (this.io) {
      this.io.emit('live:tick', this.getClientPayload());
    }
    return this.whatIfOverrides;
  }

  resetScenario() {
    this.whatIfOverrides = {
      demandSurgeMultiplier: 1.0,
      eventStartTimeDeltas: {},
      transitCapacityDeltas: {},
    };
    this.evaluateIntelligence();
    if (this.io) {
      this.io.emit('live:tick', this.getClientPayload());
    }
    return this.whatIfOverrides;
  }

  getClientPayload() {
    return {
      simulatedTime: this.simulatedTime,
      speedMultiplier: this.speedMultiplier,
      isPaused: this.isPaused,
      whatIfOverrides: this.whatIfOverrides,
      zones: Array.from(this.zones.values()),
      venues: Array.from(this.venues.values()),
      transitEdges: Array.from(this.transitEdges.values()),
      forecast: this.activeForecast,
      alerts: this.activeAlerts,
      recommendations: this.activeRecommendations,
      historyLength: this.recentSnapshots.length,
    };
  }

  /**
   * Routing recommendation algorithm for attendees.
   */
  findOptimalRoute(fromZoneId, toZoneId, preference = 'least_crowded') {
    const directEdge = Array.from(this.transitEdges.values()).find(
      (e) => (e.fromZoneId === fromZoneId && e.toZoneId === toZoneId) ||
             (e.fromZoneId === toZoneId && e.toZoneId === fromZoneId)
    );

    const fromZone = this.zones.get(fromZoneId);
    const toZone = this.zones.get(toZoneId);

    const directTime = directEdge ? directEdge.liveStatus.currentTravelTimeMinutes : 12;
    const directStress = toZone ? toZone.liveMetrics.compositeStressScore : 50;

    // Identify alternate less-crowded destination zone
    let alternateZone = null;
    let lowestStress = directStress;

    for (const [zId, z] of this.zones) {
      if (zId !== fromZoneId && zId !== toZoneId && z.liveMetrics.compositeStressScore < lowestStress - 15) {
        lowestStress = z.liveMetrics.compositeStressScore;
        alternateZone = z;
      }
    }

    return {
      fromZone: fromZone?.name || fromZoneId,
      toZone: toZone?.name || toZoneId,
      primaryRoute: {
        edgeName: directEdge?.name || 'Direct Transit Corridor',
        mode: directEdge?.mode || 'shuttle_bus',
        estimatedMinutes: directTime,
        crowdednessRating: directStress > 75 ? 'High Congestion' : 'Comfortable',
      },
      alternateRecommendation: alternateZone
        ? {
            zoneId: alternateZone._id,
            zoneName: alternateZone.name,
            stressScore: alternateZone.liveMetrics.compositeStressScore,
            reason: `Save ~15 min travel time and enjoy open festival screenings at ${alternateZone.name}.`,
          }
        : null,
    };
  }
}

module.exports = CrowdSimulator;
