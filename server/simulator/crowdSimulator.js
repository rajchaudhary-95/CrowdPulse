/**
 * In-Memory Crowd & Transit Simulation Engine
 * Runs the live virtual heartbeat, synchronizes state, and emits real-time WebSocket ticks.
 */

const { mockZones, mockVenues, mockTransitEdges, mockConcessions, mockAnnouncements } = require('./mockData');
const { SIMULATION, STRESS_WEIGHTS } = require('../config/thresholds');
const { forecastCrowdPressure } = require('../services/forecasting.service');
const { computeRedistributionPlan } = require('../services/optimization.service');
const { evaluateAlertRules } = require('../services/alert.service');

const ZoneModel = require('../models/Zone');
const VenueModel = require('../models/Venue');
const TransitEdgeModel = require('../models/TransitEdge');
const VisitorFlowSnapshotModel = require('../models/VisitorFlowSnapshot');
const ConcessionModel = require('../models/Concession');
const AnnouncementModel = require('../models/Announcement');
const ReminderModel = require('../models/Reminder');
const AuditLogModel = require('../models/AuditLog');

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
    this.concessions = new Map();
    this.announcements = [];
    this.reminders = new Map(); // reminderId -> reminder
    this.bookmarks = new Map(); // userIdentifier -> Set of concessionIds

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
      const { getSupabase, isSupabaseConfigured } = require('../config/supabase');
      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        const { data: supaZones } = await supabase.from('zones').select('*');
        const { data: supaVenues } = await supabase.from('venues').select('*');
        const { data: supaEdges } = await supabase.from('transit_edges').select('*');

        if (supaZones && supaZones.length > 0) {
          for (const z of supaZones) {
            this.zones.set(z.id, {
              _id: z.id,
              name: z.name,
              category: z.category,
              geoCenter: z.geo_center,
              geoBoundary: z.geo_boundary,
              totalCapacity: z.total_capacity,
              liveMetrics: z.live_metrics,
              metadata: z.metadata,
            });
          }
          for (const v of (supaVenues || [])) {
            this.venues.set(v.id, {
              _id: v.id,
              name: v.name,
              zoneId: v.zone_id,
              location: v.location,
              capacity: v.capacity,
              scheduledEvents: v.scheduled_events,
            });
          }
          for (const e of (supaEdges || [])) {
            this.transitEdges.set(e.id, {
              _id: e.id,
              name: e.id.replace(/-/g, ' ').replace('edge', '').trim(),
              fromZoneId: e.source_zone_id,
              toZoneId: e.target_zone_id,
              mode: e.mode,
              nominalCapacityPerHour: e.capacity_per_hour,
              pathCoordinates: e.polyline,
              liveStatus: {
                currentFlowPerHour: e.current_flow_rate || 0,
                utilizationRate: e.capacity_per_hour ? (e.current_flow_rate / e.capacity_per_hour) : 0,
                congestionLevel: e.status || 'optimal',
              },
            });
          }
          for (const c of mockConcessions) this.concessions.set(c._id, JSON.parse(JSON.stringify(c)));
          this.announcements = JSON.parse(JSON.stringify(mockAnnouncements));

          this.evaluateIntelligence();
          console.log(`[Simulator] Hydrated from Supabase PostgreSQL: ${this.zones.size} zones, ${this.venues.size} venues, ${this.transitEdges.size} transit links, ${this.concessions.size} concessions.`);
          return;
        }
      }

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
      for (const c of mockConcessions) this.concessions.set(c._id, JSON.parse(JSON.stringify(c)));
      this.announcements = JSON.parse(JSON.stringify(mockAnnouncements));

      // Perform initial intelligence evaluation
      this.evaluateIntelligence();
      console.log(`[Simulator] Initialized with ${this.zones.size} zones, ${this.venues.size} venues, ${this.transitEdges.size} transit links, ${this.concessions.size} concessions.`);
    } catch (err) {
      console.warn(`[Simulator Warning] Initializing directly from memory: ${err.message}`);
      for (const z of mockZones) this.zones.set(z._id, JSON.parse(JSON.stringify(z)));
      for (const v of mockVenues) this.venues.set(v._id, JSON.parse(JSON.stringify(v)));
      for (const e of mockTransitEdges) this.transitEdges.set(e._id, JSON.parse(JSON.stringify(e)));
      for (const c of mockConcessions) this.concessions.set(c._id, JSON.parse(JSON.stringify(c)));
      this.announcements = JSON.parse(JSON.stringify(mockAnnouncements));
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
      console.warn(`[Simulator Seed Notice] MongoDB seed notice: ${err.message}`);
    }

    try {
      const { getSupabase, isSupabaseConfigured } = require('../config/supabase');
      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('venues').delete().neq('id', 'placeholder');
        await supabase.from('transit_edges').delete().neq('id', 'placeholder');
        await supabase.from('zones').delete().neq('id', 'placeholder');

        const supaZones = mockZones.map((z) => ({
          id: z._id,
          name: z.name,
          category: z.category,
          geo_center: z.geoCenter,
          geo_boundary: z.geoBoundary,
          total_capacity: z.totalCapacity,
          live_metrics: z.liveMetrics,
          metadata: z.metadata,
        }));
        await supabase.from('zones').upsert(supaZones);

        const supaVenues = mockVenues.map((v) => ({
          id: v._id,
          name: v.name,
          zone_id: v.zoneId,
          location: v.location,
          capacity: v.maxCapacity,
          scheduled_events: v.scheduledEvents,
        }));
        await supabase.from('venues').upsert(supaVenues);

        const supaEdges = mockTransitEdges.map((e) => ({
          id: e._id,
          source_zone_id: e.fromZoneId,
          target_zone_id: e.toZoneId,
          mode: e.mode,
          capacity_per_hour: e.maxThroughputPerHour,
          current_flow_rate: e.liveStatus?.currentFlowPerHour || 0,
          congestion_index: e.liveStatus?.utilizationRate || 0,
          status: e.liveStatus?.congestionLevel || 'optimal',
          polyline: e.pathCoordinates,
        }));
        await supabase.from('transit_edges').upsert(supaEdges);
        console.log('[Simulator] Supabase PostgreSQL successfully reseeded with Alegria dataset.');
      }
    } catch (supaErr) {
      console.warn(`[Simulator Seed Notice] Supabase seed notice: ${supaErr.message}`);
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
      const rawDelta = this.whatIfOverrides.transitCapacityDeltas?.[edgeId];
      const capMultiplier = typeof rawDelta === 'number'
        ? (rawDelta > 10 ? Math.max(1.0, rawDelta / (edge.maxThroughputPerHour || 4000)) : rawDelta)
        : 1.0;
      const effectiveMax = (edge.maxThroughputPerHour || 4000) * capMultiplier;

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

    // Apply relief to connected zones if transit edges have capacity boost
    for (const [zoneId, zone] of this.zones) {
      if (!zone.baseVenueCapacity && zone.totalCapacity?.venue) {
        zone.baseVenueCapacity = zone.totalCapacity.venue;
      }
      if (!zone.baseVenueOccupancy && zone.liveMetrics?.currentVenueOccupancy) {
        zone.baseVenueOccupancy = zone.liveMetrics.currentVenueOccupancy;
      }

      let maxConnectedBoost = 1.0;
      for (const [edgeId, edge] of this.transitEdges) {
        if (edge.fromZoneId === zoneId || edge.toZoneId === zoneId) {
          const raw = this.whatIfOverrides.transitCapacityDeltas?.[edgeId];
          if (raw && raw > 1.0) {
            const boost = raw > 10 ? raw / (edge.maxThroughputPerHour || 4000) : raw;
            if (boost > maxConnectedBoost) maxConnectedBoost = boost;
          }
        }
      }

      if (maxConnectedBoost > 1.0) {
        // Boost throughput capacity limit for the sector
        if (zone.totalCapacity && zone.baseVenueCapacity) {
          zone.totalCapacity.venue = Math.round(zone.baseVenueCapacity * maxConnectedBoost);
        }

        // Relieve backlog: Shuttles actively transport attendees away from the station to campus
        const reliefFactor = 1.0 / maxConnectedBoost;
        if (zone.baseVenueOccupancy) {
          zone.liveMetrics.currentVenueOccupancy = Math.max(
            150,
            Math.round(zone.baseVenueOccupancy * reliefFactor)
          );
        }

        zone.liveMetrics.currentTransitPressure = Number(
          Math.max(0.12, zone.liveMetrics.currentTransitPressure * reliefFactor).toFixed(2)
        );
        zone.liveMetrics.compositeStressScore = Math.max(
          25,
          Math.round(zone.liveMetrics.compositeStressScore * (0.4 + 0.6 * reliefFactor))
        );
        zone.liveMetrics.status = zone.liveMetrics.compositeStressScore >= 88
          ? 'critical'
          : zone.liveMetrics.compositeStressScore >= 75
          ? 'warning'
          : zone.liveMetrics.compositeStressScore >= 60
          ? 'elevated'
          : 'normal';
      } else if (zone.baseVenueCapacity && zone.totalCapacity) {
        // Restore to original baseline limit and occupancy when overrides are cleared
        zone.totalCapacity.venue = zone.baseVenueCapacity;
        if (zone.baseVenueOccupancy) {
          zone.liveMetrics.currentVenueOccupancy = zone.baseVenueOccupancy;
        }
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

    try {
      const { getSupabase } = require('../config/supabase');
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('visitor_flow_snapshots').insert([{
          timestamp: snapshot.simulatedTime,
          tick_index: this.tickCount,
          system_occupancy_total: snapshot.globalMetrics?.totalActiveVisitors || 0,
          zones_summary: snapshot.zoneSnapshots || [],
        }]);
      }
    } catch (err) {
      // Non-blocking fail-safe
    }
  }

  updateScenario(overrides = {}) {
    this.whatIfOverrides = {
      ...this.whatIfOverrides,
      ...overrides,
    };
    this.advanceCrowdDynamics(0);
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
    this.advanceCrowdDynamics(0);
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
      egressAdvisory: this.getEgressAdvisory(),
      announcements: this.getAnnouncements(),
    };
  }

  /**
   * Campus Graph Pathfinding Engine for Pillai Alegria Festival
   * Calculates multi-criteria route options: Crowd-Free Bypass vs. Standard Concourse.
   */
  findOptimalRoute(fromZoneId, toZoneId, preference = 'least_crowded') {
    const fromZone = this.zones.get(fromZoneId);
    const toZone = this.zones.get(toZoneId);

    if (!fromZone || !toZone) {
      return { error: 'Invalid zone identifiers supplied' };
    }

    // Gate operational intelligence based on origin zone
    let gateOperationalInfo = null;
    if (fromZoneId === 'zone-atrium-main') {
      gateOperationalInfo = {
        gateName: 'Gate 1 (Sector 16 Front Main Gate)',
        designatedFor: 'Girls Entry, Artists, VIPs & Faculty',
        checkpointType: 'Pillai Student ID Scanners & Alegria Ticket Turnstiles',
        turnstileStatus: '4 Active Turnstiles • Low Queue',
        estimatedWaitMinutes: 1,
        studentTip: 'Have your Pillai ID barcode or digital Alegria ticket ready on your phone before stepping into the turnstile lane.',
      };
    } else if (fromZoneId === 'zone-canteen-back') {
      gateOperationalInfo = {
        gateName: 'Gate 2 (Back Cafeteria Lane)',
        designatedFor: 'Dedicated Boys Entry',
        checkpointType: 'Security Metal Detector Doorframe, Frisking & Bag Checks',
        turnstileStatus: '3 Lanes Active • Medium Inspection Queue',
        estimatedWaitMinutes: 4,
        studentTip: 'No outside open beverages or aerosol sprays permitted through Gate 2 security frisking.',
      };
    } else if (fromZoneId === 'zone-panvel-transit') {
      gateOperationalInfo = {
        gateName: 'Sector 16 Auto Loop & Bus Depot',
        designatedFor: 'External Transit Feeder to Pillai Campus',
        checkpointType: 'Fixed Rate Share-Auto Stand (₹25-30) & NMMT Feeder Loop',
        turnstileStatus: 'Vehicles departing every 2 mins',
        estimatedWaitMinutes: 3,
        studentTip: 'Ask the auto driver for "Pillai College Main Gate (Gate 1)" or "Pillai Canteen Gate (Gate 2)".',
      };
    }

    // Edge case: Same zone
    if (fromZoneId === toZoneId) {
      const occ = fromZone.liveMetrics?.currentVenueOccupancy || 800;
      const cap = fromZone.totalCapacity?.venue || 2000;
      const pct = Math.min(100, Math.round((occ / cap) * 100));

      return {
        fromZoneId,
        toZoneId,
        fromZoneName: fromZone.name,
        toZoneName: toZone.name,
        preference,
        isSameZone: true,
        timeSavedMinutes: 0,
        gateOperationalInfo,
        tacticalAdvice: `You are currently stationed within ${fromZone.name}. Local area density is ${pct}%.`,
        recommendedRoute: {
          title: `Inside ${fromZone.name}`,
          badge: 'LOCAL EXPLORATION',
          totalMinutes: 1,
          baseWalkMinutes: 1,
          delayMinutes: 0,
          totalDistanceMeters: 40,
          crowdDensityPct: pct,
          pace: 'Leisurely Stroll (1.3 m/s)',
          surface: 'Local Concourse & Seating',
          turnstileWait: '0 min wait',
          isStepFree: true,
          pathNodes: [fromZoneId],
          corridorSummary: `${fromZone.name} Perimeter`,
          steps: [
            {
              stepNumber: 1,
              fromZoneName: fromZone.name,
              toZoneName: fromZone.name,
              instruction: `Explore concessions, facilities, and stages inside ${fromZone.name}.`,
              landmark: fromZone.name,
              distanceMeters: 40,
              baseWalkSeconds: 60,
              delaySeconds: 0,
              isChokepoint: false,
              isStepFree: true,
              crowdLevel: pct > 75 ? 'gridlock' : 'free_flow',
              surfaceType: 'Flat Concourse',
              paceDescription: 'Leisurely Pace',
              studentProTip: 'Stay hydrated at local campus water cooler stations.',
              icon: 'landmark',
            },
          ],
        },
        standardRoute: null,
      };
    }

    // 1. Build adjacency list from transitEdges (bidirectional campus walkways)
    const adj = new Map();
    for (const zId of this.zones.keys()) adj.set(zId, []);

    for (const edge of this.transitEdges.values()) {
      if (!adj.has(edge.fromZoneId)) adj.set(edge.fromZoneId, []);
      if (!adj.has(edge.toZoneId)) adj.set(edge.toZoneId, []);

      adj.get(edge.fromZoneId).push({ to: edge.toZoneId, edge });
      adj.get(edge.toZoneId).push({ to: edge.fromZoneId, edge });
    }

    // 2. Find simple paths via DFS (depth limit 5)
    const allPaths = [];
    const visited = new Set([fromZoneId]);

    const dfs = (current, target, currentPath) => {
      if (current === target) {
        allPaths.push([...currentPath]);
        return;
      }
      if (currentPath.length >= 5) return;

      const neighbors = adj.get(current) || [];
      for (const { to, edge } of neighbors) {
        if (!visited.has(to)) {
          visited.add(to);
          currentPath.push({ from: current, to, edge });
          dfs(to, target, currentPath);
          currentPath.pop();
          visited.delete(to);
        }
      }
    };

    dfs(fromZoneId, toZoneId, []);

    // 3. Fallback path if graph disconnected
    if (allPaths.length === 0) {
      return {
        fromZoneId,
        toZoneId,
        fromZoneName: fromZone.name,
        toZoneName: toZone.name,
        preference,
        timeSavedMinutes: 0,
        gateOperationalInfo,
        tacticalAdvice: 'Direct pedestrian link.',
        recommendedRoute: {
          title: 'Direct Campus Walkway',
          badge: 'DIRECT ROUTE',
          totalMinutes: 5,
          baseWalkMinutes: 5,
          delayMinutes: 0,
          totalDistanceMeters: 350,
          crowdDensityPct: 35,
          pace: 'Normal Pace (1.3 m/s)',
          surface: 'Paved Concourse',
          turnstileWait: '0 - 1 min wait',
          isStepFree: true,
          pathNodes: [fromZoneId, toZoneId],
          corridorSummary: `${fromZone.name} → ${toZone.name}`,
          steps: [
            {
              stepNumber: 1,
              fromZoneName: fromZone.name,
              toZoneName: toZone.name,
              instruction: `Follow campus directional signage from ${fromZone.name} to ${toZone.name}.`,
              landmark: toZone.name,
              distanceMeters: 350,
              baseWalkSeconds: 300,
              delaySeconds: 0,
              isChokepoint: false,
              isStepFree: true,
              crowdLevel: 'free_flow',
              surfaceType: 'Paved Concourse',
              paceDescription: 'Normal Pace',
              studentProTip: 'Follow floor arrow decals toward the venue entrance.',
              icon: 'walkway',
            },
          ],
        },
        standardRoute: null,
      };
    }

    // 4. Evaluate each candidate path with live metrics, accessibility, and penalties
    const evaluatedPaths = allPaths.map((path) => {
      let totalMeters = 0;
      let baseWalkSeconds = 0;
      let congestionPenaltySeconds = 0;
      let totalStress = 0;
      let hasMajorChoke = false;
      let hasStairs = false;
      let passesFood = false;
      let chokepointName = null;

      const steps = [];

      for (let i = 0; i < path.length; i++) {
        const { from, to, edge } = path[i];
        const stepFromZone = this.zones.get(from);
        const stepToZone = this.zones.get(to);

        const dist = edge.distanceMeters || 180;
        totalMeters += dist;

        // Base walking time at 1.3 meters/second (~4.7 km/h)
        const legWalkSec = Math.round(dist / 1.3);
        baseWalkSeconds += legWalkSec;

        const edgeUtil = edge.liveStatus?.utilizationRate || 0.3;
        const targetStress = stepToZone?.liveMetrics?.compositeStressScore || 30;
        totalStress += targetStress;

        let legDelaySec = 0;
        let isChoke = false;
        let isLegStepFree = true;
        let surfaceType = 'Paved Flat Concourse';
        let paceDescription = 'Smooth Pace (1.3 m/s)';
        let studentProTip = '';

        // Chokepoint & stairs identification
        if (to === 'zone-quadrangle' || from === 'zone-quadrangle') {
          hasStairs = true;
          isLegStepFree = false;
          surfaceType = 'Sunken Amphitheater Stairs';
        }

        if (to === 'zone-canteen-back' || from === 'zone-canteen-back') {
          passesFood = true;
        }

        if (to === 'zone-quadrangle' || edge.liveStatus?.congestionLevel === 'gridlock' || edgeUtil >= 0.85) {
          legDelaySec = 360; // 6 mins queuing stall
          hasMajorChoke = true;
          chokepointName = stepToZone?.name || edge.name;
          isChoke = true;
          paceDescription = 'Slow Crawl (< 0.4 m/s)';
        } else if (edgeUtil >= 0.60 || targetStress >= 65) {
          legDelaySec = 120; // 2 mins delay
          paceDescription = 'Brisk Striding (0.9 m/s)';
        }

        congestionPenaltySeconds += legDelaySec;

        // Formulate student-grounded navigation instructions & landmarks
        let instruction = '';
        let landmark = stepToZone?.name || to;
        let icon = 'walkway';

        if (i === 0) {
          if (from === 'zone-atrium-main') {
            instruction = 'Pass Gate 1 Turnstiles (Girls & VIP entry, ID scan) into Engineering Main Atrium.';
            landmark = 'Gate 1 Turnstiles & Atrium Lobby';
            icon = 'gate';
            studentProTip = 'Volunteers at the Atrium Helpdesk distribute Alegria festival lanyards and schedule pamphlets.';
          } else if (from === 'zone-canteen-back') {
            instruction = 'Depart Gate 2 Security (Dedicated Boys Entry & Frisking) into the Canteen Concourse.';
            landmark = 'Gate 2 Security & Canteen Concourse';
            icon = 'gate';
            studentProTip = 'Boys queue is split into 3 frisking lines; lane 1 has dedicated bag scanner.';
          } else if (from === 'zone-panvel-transit') {
            instruction = 'Board Sector 16 Auto Loop (Fixed ₹25-30 share-auto) directly to Pillai Campus.';
            landmark = 'Sector 16 Auto Depot / Bus Stand';
            icon = 'transit';
            studentProTip = 'Share-autos fill up rapidly; have ₹30 cash or UPI ready for the driver.';
          } else {
            instruction = `Depart from ${stepFromZone?.name || from}.`;
          }
        }

        if (to === 'zone-sports-ground') {
          instruction = instruction
            ? `${instruction} Bear left along the shaded PICA Architecture Ramp bypass.`
            : 'Walk along the wide PICA Architecture ADA-compliant paved ramp and shaded chill lawn.';
          landmark = 'PICA Architecture Ramp & Lawn';
          icon = 'ramp';
          isLegStepFree = true;
          surfaceType = 'Paved ADA Ramp (Step-Free)';
          studentProTip = 'Chilled drinking water dispenser & shaded acoustic seating available outside PICA studio.';
        } else if (to === 'zone-canteen-back') {
          instruction = instruction
            ? `${instruction} Head through the covered ground-floor arcade to Campus Canteen.`
            : 'Pass through the Campus Canteen arcade towards Gate 2.';
          landmark = 'Campus Canteen & Nescafe Plaza';
          icon = 'food';
          isLegStepFree = true;
          surfaceType = 'Covered Concourse';
          studentProTip = 'Nescafe coffee stall and Frankie counter accept quick UPI scanning.';
        } else if (to === 'zone-quadrangle') {
          instruction = instruction
            ? `${instruction} Step down into The Quadrangle concourse.`
            : 'Traverse the sunken Central Quadrangle amphitheater concourse.';
          landmark = 'The Quadrangle (Central Axis)';
          icon = 'alert';
          isLegStepFree = false;
          surfaceType = 'Concrete Sunken Amphitheater Stairs';
          studentProTip = 'High event volume and stage crowds cause dense foot traffic. Keep along the perimeter walkway for smoother passage.';
        } else if (to === 'zone-main-ground') {
          if (isChoke) {
            instruction = 'Proceed through the South Turnstiles into the Main Concert Ground.';
            landmark = 'Main Concert Ground (South Turnstiles)';
            icon = 'alert';
            surfaceType = 'Crowded Concourse Turnstile';
            studentProTip = 'South entrance experiencing high attendee volume: ~8 minute wait to enter stage area.';
          } else {
            instruction = 'Walk smoothly through the open North-West Lawn Perimeter Gate into the Main Concert Arena with zero queue.';
            landmark = 'Alegria Main Concert Arena (North Lawn Gate)';
            icon = 'arena';
            isLegStepFree = true;
            surfaceType = 'Paved Lawn Ramp (Zero Queue)';
            studentProTip = 'North Lawn entrance leads directly into the soundboard area with clear sightlines of the EDM mainstage.';
          }
        } else if (to === 'zone-atrium-main') {
          instruction = instruction
            ? `${instruction} Enter Engineering Building main atrium.`
            : 'Proceed into Engineering Building main atrium.';
          landmark = 'Engineering Atrium & Gate 1 Exit';
          icon = 'gate';
          isLegStepFree = true;
          surfaceType = 'Polished Granite Foyer';
          studentProTip = 'Ground floor washrooms (Ladies & Gents) located just behind the main elevator bay.';
        } else if (to === 'zone-panvel-transit') {
          instruction = 'Exit campus gates and catch the Sector 16 Auto Loop towards Panvel Railway Station.';
          landmark = 'Sector 16 Auto Stand & Station Feeder';
          icon = 'transit';
          isLegStepFree = true;
          surfaceType = 'External Paved Roadway';
          studentProTip = 'Return share-autos to Panvel Station run continuously until 23:30.';
        } else {
          instruction = instruction || `Continue along ${edge.name}.`;
        }

        steps.push({
          stepNumber: i + 1,
          fromZoneName: stepFromZone?.name || from,
          toZoneName: stepToZone?.name || to,
          instruction,
          landmark,
          distanceMeters: dist,
          baseWalkSeconds: legWalkSec,
          delaySeconds: legDelaySec,
          isChokepoint: isChoke,
          isStepFree: isLegStepFree,
          crowdLevel: isChoke ? 'gridlock' : edgeUtil > 0.55 ? 'moderate' : 'free_flow',
          surfaceType,
          paceDescription,
          studentProTip,
          icon,
        });
      }

      const totalEffectiveMinutes = Math.max(1, Math.round((baseWalkSeconds + congestionPenaltySeconds) / 60));
      const baseWalkMinutes = Math.max(1, Math.round(baseWalkSeconds / 60));
      const delayMinutes = Math.round(congestionPenaltySeconds / 60);
      const avgStress = Math.round(totalStress / path.length);
      const isPathStepFree = !hasStairs;

      return {
        pathNodes: [fromZoneId, ...path.map((p) => p.to)],
        edges: path.map((p) => p.edge),
        totalDistanceMeters: totalMeters,
        baseWalkMinutes,
        delayMinutes,
        totalEffectiveMinutes,
        avgStress,
        hasMajorChoke,
        hasStairs,
        isPathStepFree,
        passesFood,
        chokepointName,
        steps,
      };
    });

    // 5. Select Recommended Route based on requested preference
    let recommended = null;

    if (preference === 'shortest_distance') {
      // Shortest physical distance
      const distanceSorted = [...evaluatedPaths].sort((a, b) => a.totalDistanceMeters - b.totalDistanceMeters);
      recommended = distanceSorted[0];
    } else if (preference === 'step_free') {
      // 100% Step-free (Ramps only, no Quad stairs)
      const stepFree = evaluatedPaths.filter((p) => p.isPathStepFree);
      if (stepFree.length > 0) {
        stepFree.sort((a, b) => a.totalEffectiveMinutes - b.totalEffectiveMinutes);
        recommended = stepFree[0];
      } else {
        recommended = [...evaluatedPaths].sort((a, b) => a.totalEffectiveMinutes - b.totalEffectiveMinutes)[0];
      }
    } else if (preference === 'food_restroom') {
      // Passes food/amenities
      const foodPaths = evaluatedPaths.filter((p) => p.passesFood);
      if (foodPaths.length > 0) {
        foodPaths.sort((a, b) => a.totalEffectiveMinutes - b.totalEffectiveMinutes);
        recommended = foodPaths[0];
      } else {
        recommended = [...evaluatedPaths].sort((a, b) => a.totalEffectiveMinutes - b.totalEffectiveMinutes)[0];
      }
    } else {
      // Default: 'least_crowded' (Crowd-Free Bypass, avoids Quad bottleneck)
      const crowdFreeSorted = [...evaluatedPaths].sort((a, b) => {
        if (a.hasMajorChoke !== b.hasMajorChoke) {
          return a.hasMajorChoke ? 1 : -1;
        }
        return a.totalEffectiveMinutes - b.totalEffectiveMinutes;
      });
      recommended = crowdFreeSorted[0];
    }

    // 6. Select Standard / Direct Alternative for comparison
    const distanceSorted = [...evaluatedPaths].sort((a, b) => a.totalDistanceMeters - b.totalDistanceMeters);
    let standard = distanceSorted.find((p) => p.hasMajorChoke) || distanceSorted[0];

    if (standard === recommended && evaluatedPaths.length > 1) {
      standard = evaluatedPaths.find((p) => p !== recommended) || evaluatedPaths[1];
    }

    const timeSavedMinutes = Math.max(0, standard.totalEffectiveMinutes - recommended.totalEffectiveMinutes);

    // Formulate tactical advice string
    let tacticalAdvice = '';
    if (preference === 'shortest_distance') {
      tacticalAdvice = standard.hasMajorChoke
        ? `⚠️ Note: Shortest physical distance cuts through ${standard.chokepointName || 'The Quad'}, which currently has high foot traffic (+${standard.delayMinutes} mins delay).`
        : 'Shortest physical direct route across campus.';
    } else if (preference === 'step_free') {
      tacticalAdvice = '♿ 100% Step-Free Route: Utilizes PICA Architecture ADA ramps and ground level foyers (zero stairs).';
    } else if (preference === 'food_restroom') {
      tacticalAdvice = '🍔 Pitstop Route: Passes Campus Canteen Nescafe counter, snack stalls, and hydration stations.';
    } else {
      tacticalAdvice = timeSavedMinutes > 0
        ? `🌿 Saves ~${timeSavedMinutes} mins by taking the PICA Architecture Lawn corridor instead of the busy central concourse.`
        : 'This is the most efficient, free-flowing route across Pillai Campus.';
    }

    return {
      fromZoneId,
      toZoneId,
      fromZoneName: fromZone.name,
      toZoneName: toZone.name,
      preference,
      timeSavedMinutes,
      gateOperationalInfo,
      tacticalAdvice,
      recommendedRoute: {
        title: preference === 'step_free'
          ? 'Step-Free Ramp Route (Recommended)'
          : preference === 'shortest_distance'
          ? 'Shortest Distance Route'
          : preference === 'food_restroom'
          ? 'Canteen & Snack Corridor'
          : 'Crowd-Free Bypass (Recommended)',
        badge: preference === 'step_free'
          ? '100% STEP-FREE (ADA RAMPS)'
          : preference === 'shortest_distance'
          ? 'SHORTEST DISTANCE'
          : preference === 'food_restroom'
          ? 'FOOD & REFRESHMENTS'
          : 'CROWD-FREE BYPASS',
        totalMinutes: recommended.totalEffectiveMinutes,
        baseWalkMinutes: recommended.baseWalkMinutes,
        delayMinutes: recommended.delayMinutes,
        totalDistanceMeters: recommended.totalDistanceMeters,
        crowdDensityPct: Math.min(85, Math.max(18, recommended.avgStress)),
        pace: recommended.hasMajorChoke ? 'Slow Crawl (< 0.4 m/s)' : 'Smooth Pace (1.3 m/s)',
        surface: recommended.isPathStepFree ? 'Paved & ADA Ramp (Step-Free)' : 'Concourse with Stairs',
        turnstileWait: recommended.delayMinutes > 0 ? `${recommended.delayMinutes} min wait` : '0 - 1 min wait',
        isStepFree: recommended.isPathStepFree,
        pathNodes: recommended.pathNodes,
        corridorSummary: recommended.steps.map((s) => s.landmark).join(' → '),
        steps: recommended.steps,
      },
      standardRoute: standard ? {
        title: 'Direct Concourse Option',
        badge: standard.hasMajorChoke ? 'Direct • High Foot Traffic' : 'Direct Flow',
        totalMinutes: standard.totalEffectiveMinutes,
        baseWalkMinutes: standard.baseWalkMinutes,
        delayMinutes: standard.delayMinutes,
        totalDistanceMeters: standard.totalDistanceMeters,
        crowdDensityPct: Math.min(98, Math.max(65, standard.avgStress + 22)),
        pace: standard.hasMajorChoke ? 'Slow Crawl (< 0.4 m/s)' : 'Normal Pace (1.1 m/s)',
        surface: standard.hasStairs ? 'Main Concourse (Sunken Steps)' : 'Main Concourse Spine',
        turnstileWait: `${standard.delayMinutes || 4} - ${standard.delayMinutes + 4} min queue`,
        isStepFree: standard.isPathStepFree,
        pathNodes: standard.pathNodes,
        chokepointNote: standard.chokepointName ? `High foot traffic along ${standard.chokepointName}` : null,
        corridorSummary: standard.steps.map((s) => s.landmark).join(' → '),
        steps: standard.steps,
      } : null,
      // Backward-compatible aliases
      primaryRoute: {
        edgeName: recommended.steps.map((s) => s.landmark).join(' → '),
        estimatedMinutes: recommended.totalEffectiveMinutes,
        crowdednessRating: recommended.avgStress > 70 ? 'high' : 'low',
        distanceMeters: recommended.totalDistanceMeters,
      },
      alternateRecommendation: standard ? {
        reason: standard.chokepointNote || 'Direct concourse route',
        estimatedMinutes: standard.totalEffectiveMinutes,
      } : null,
    };
  }

  /**
   * Optimal Travel / Egress Window Advisor (Visitor-Friendly)
   * Computes recommended departure window without scary jargon or panic-inducing percentages
   */
  getEgressAdvisory() {
    const mainVenue = this.venues.get('venue-alegria-main-stage');

    const edmEvent = mainVenue?.scheduledEvents?.find((e) => e.eventId.includes('edm')) || mainVenue?.scheduledEvents?.[0];
    const eventEndTime = edmEvent?.endTime ? new Date(edmEvent.endTime) : new Date(this.simulatedTime.getTime() + 120 * 60000);

    // Recommended departure is ~45 minutes prior to mass event conclusion
    const optimalExitDate = new Date(eventEndTime.getTime() - 45 * 60000);
    const busyDepartureDate = new Date(eventEndTime.getTime() - 15 * 60000);

    const pad = (n) => String(n).padStart(2, '0');
    const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const exitTargetStr = formatTime(optimalExitDate);
    const busyTargetStr = formatTime(busyDepartureDate);

    return {
      recommendedExitTarget: exitTargetStr,
      recommendedExitISO: optimalExitDate.toISOString(),
      busyDepartureTime: busyTargetStr,
      windowStatus: 'Optimal Flow Window',
      estimatedExtraDelayMinutes: '15–20 mins',
      tacticalAdvice: `Based on our crowd prediction, heading out around ${exitTargetStr} will give you an easy, smooth exit. Leaving after ${busyTargetStr} may take an extra ~15 to 20 minutes to reach the gates.`,
      eventName: edmEvent?.name || 'Alegria Evening Stage',
    };
  }

  /**
   * Concourse Triage Discovery Hub ("Skip the Queues")
   * Returns campus POIs with live computed wait times based on parent zone metrics
   */
  getConcessions(category = 'all') {
    const list = Array.from(this.concessions.values());
    const filtered = (category && category !== 'all') ? list.filter((c) => c.category === category) : list;

    return filtered.map((c) => {
      const parentZone = this.zones.get(c.zoneId);
      const stress = parentZone?.liveMetrics?.compositeStressScore || 30;
      const occ = parentZone?.liveMetrics?.currentVenueOccupancy || 500;
      const cap = parentZone?.totalCapacity?.venue || 2000;
      const occPct = Math.min(100, Math.round((occ / cap) * 100));

      let dynamicWait = c.baseWaitMinutes || 2;
      let capacityRating = 'low';

      if (c.category === 'food') {
        dynamicWait = Math.round((c.baseWaitMinutes || 2) * (stress / 35));
        if (c.zoneId === 'zone-main-ground') dynamicWait = Math.max(14, dynamicWait);
      } else if (c.category === 'restrooms') {
        dynamicWait = Math.max(0, Math.round((stress - 30) / 10));
      } else if (c.category === 'transit') {
        dynamicWait = Math.max(2, Math.round(3 + (stress / 25)));
      }

      capacityRating = occPct > 80 ? 'high' : occPct > 45 ? 'moderate' : 'low';

      return {
        ...c,
        liveWaitMinutes: Math.max(0, dynamicWait),
        liveOccupancyPct: occPct,
        capacityRating,
        parentZoneName: parentZone?.name || c.zoneId,
      };
    });
  }

  /**
   * Real-Time Queue & Facility Wait Times Dashboard
   */
  getFacilityWaitTimes() {
    const atrium = this.zones.get('zone-atrium-main');
    const canteen = this.zones.get('zone-canteen-back');
    const quad = this.zones.get('zone-quadrangle');

    return [
      {
        facilityId: 'facility-gate1-turnstiles',
        name: 'Gate 1 Turnstiles (Girls & VIP Entry)',
        zoneName: 'Engineering Atrium',
        zoneId: 'zone-atrium-main',
        category: 'gate',
        queueMinutes: 1,
        activeLanes: 4,
        status: 'optimal',
        statusLabel: 'Rapid Clearance • 1 min wait',
        capacityPct: Math.round(((atrium?.liveMetrics?.currentVenueOccupancy || 800) / 2000) * 100),
        trend: 'stable',
        tip: 'Pillai Student ID & online barcode scanner operational',
      },
      {
        facilityId: 'facility-gate2-boys-security',
        name: 'Gate 2 Security Frisking (Boys Dedicated)',
        zoneName: 'Campus Canteen Lane',
        zoneId: 'zone-canteen-back',
        category: 'gate',
        queueMinutes: 4,
        activeLanes: 3,
        status: 'moderate',
        statusLabel: 'Bag Inspection Active • ~4 min wait',
        capacityPct: Math.round(((canteen?.liveMetrics?.currentVenueOccupancy || 1100) / 1800) * 100),
        trend: 'rising',
        tip: 'Doorframe metal detectors running on all 3 lanes',
      },
      {
        facilityId: 'facility-canteen-food',
        name: 'Campus Canteen & Nescafe Counters',
        zoneName: 'Canteen Concourse',
        zoneId: 'zone-canteen-back',
        category: 'food',
        queueMinutes: 3,
        activeLanes: 5,
        status: 'optimal',
        statusLabel: '< 3 min wait',
        capacityPct: 45,
        trend: 'stable',
        tip: 'UPI payments expedite Frankie & Beverage lines',
      },
      {
        facilityId: 'facility-quad-choke',
        name: 'The Central Quadrangle Concourse',
        zoneName: 'The Quad',
        zoneId: 'zone-quadrangle',
        category: 'transit',
        queueMinutes: 8,
        activeLanes: 2,
        status: 'gridlock',
        statusLabel: 'Heavy Foot Traffic • 8-10 min delay',
        capacityPct: Math.round(((quad?.liveMetrics?.currentVenueOccupancy || 2300) / 2500) * 100),
        trend: 'rising',
        tip: 'Bypass via PICA Architecture Lawn for smooth walking',
      },
      {
        facilityId: 'facility-atrium-restrooms',
        name: 'Engineering Ground Floor Restrooms',
        zoneName: 'Engineering Atrium',
        zoneId: 'zone-atrium-main',
        category: 'restroom',
        queueMinutes: 0,
        activeLanes: 10,
        status: 'optimal',
        statusLabel: '0 min wait (Clean)',
        capacityPct: 20,
        trend: 'stable',
        tip: 'Wheelchair accessible stalls with dedicated attendants',
      },
      {
        facilityId: 'facility-sector16-autos',
        name: 'Sector 16 Share-Auto Stand (To Station)',
        zoneName: 'Sector 16 Depot',
        zoneId: 'zone-panvel-transit',
        category: 'transit',
        queueMinutes: 3,
        activeLanes: 8,
        status: 'optimal',
        statusLabel: 'Continuous Auto Loop • ~3 min wait',
        capacityPct: 40,
        trend: 'stable',
        tip: 'Fixed ₹25-30 fare directly to Panvel Railway Station',
      },
    ];
  }

  /**
   * Announcements & Safety Broadcasts
   */
  getAnnouncements() {
    return this.announcements.filter((a) => a.isActive);
  }

  broadcastAnnouncement(announcementData) {
    const announcement = {
      _id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: announcementData.title || 'Safety & Ops Announcement',
      message: announcementData.message,
      severity: announcementData.severity || 'info',
      targetZoneId: announcementData.targetZoneId || null,
      author: announcementData.author || 'Alegria Command Center',
      isPinned: Boolean(announcementData.isPinned),
      isActive: true,
      createdAt: new Date(),
    };

    this.announcements.unshift(announcement);
    if (this.io) {
      this.io.emit('visitor:broadcastAlert', announcement);
      this.io.emit('live:tick', this.getClientPayload());
    }

    return announcement;
  }

  /**
   * Deep-Dive Zone Sensor Telemetry (Organizer View)
   */
  getZoneTelemetry(zoneId) {
    const zone = this.zones.get(zoneId);
    if (!zone) return { error: 'Zone not found' };

    const occ = zone.liveMetrics?.currentVenueOccupancy || 0;
    const cap = zone.totalCapacity?.venue || 2000;
    const stress = zone.liveMetrics?.compositeStressScore || 30;

    const connectedEdges = Array.from(this.transitEdges.values())
      .filter((e) => e.fromZoneId === zoneId || e.toZoneId === zoneId)
      .map((e) => ({
        edgeId: e._id,
        name: e.name,
        flowPerHour: e.liveStatus.currentFlowPerHour,
        congestion: e.liveStatus.congestionLevel,
        utilizationRate: e.liveStatus.utilizationRate,
      }));

    return {
      zoneId,
      name: zone.name,
      category: zone.category,
      occupancy: {
        current: occ,
        maxCapacity: cap,
        utilizationPct: Math.min(100, Math.round((occ / cap) * 100)),
      },
      flowDynamics: {
        ingressRatePerMin: Math.round((occ * 0.12) / 5),
        egressRatePerMin: Math.round((occ * 0.10) / 5),
        pedestrianVelocityMps: stress > 75 ? 0.35 : stress > 50 ? 0.9 : 1.35,
        flowStatus: stress > 75 ? 'gridlock' : stress > 50 ? 'dense_flow' : 'free_flow',
      },
      sensorHealth: {
        lidarSensorsActive: 4,
        opticalCamerasActive: 8,
        meshNodeUptimePct: 99.8,
        telemetryFrequencySeconds: 5,
        status: 'healthy',
      },
      compositeStress: {
        score: stress,
        status: zone.liveMetrics?.status || 'normal',
        densityWeight: STRESS_WEIGHTS.density,
        transitWeight: STRESS_WEIGHTS.transitCongestion,
      },
      connectedCorridors: connectedEdges,
      notes: zone.metadata?.notes || '',
    };
  }

  /**
   * Personal Egress / Event Reminders
   */
  addReminder(reminderData) {
    const reminder = {
      _id: `rem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userIdentifier: reminderData.userIdentifier || 'visitor-session',
      title: reminderData.title || 'Alegria Departure Reminder',
      targetTime: reminderData.targetTime || new Date(Date.now() + 25 * 60000),
      reminderType: reminderData.reminderType || 'egress',
      createdAt: new Date(),
    };
    this.reminders.set(reminder._id, reminder);
    return reminder;
  }

  getReminders(userIdentifier = 'visitor-session') {
    return Array.from(this.reminders.values()).filter((r) => r.userIdentifier === userIdentifier);
  }

  /**
   * Discovery Hub Bookmark Store
   */
  toggleBookmark(userIdentifier = 'visitor-session', concessionId) {
    if (!this.bookmarks.has(userIdentifier)) {
      this.bookmarks.set(userIdentifier, new Set());
    }
    const userSet = this.bookmarks.get(userIdentifier);
    let isBookmarked = false;
    if (userSet.has(concessionId)) {
      userSet.delete(concessionId);
      isBookmarked = false;
    } else {
      userSet.add(concessionId);
      isBookmarked = true;
    }
    return { userIdentifier, concessionId, isBookmarked, bookmarkedIds: Array.from(userSet) };
  }

  getBookmarks(userIdentifier = 'visitor-session') {
    const userSet = this.bookmarks.get(userIdentifier);
    return userSet ? Array.from(userSet) : [];
  }
}

module.exports = CrowdSimulator;
