const express = require('express');
const { verifyAuth, requireRole, logAuditAction, getAuditLogs } = require('../middleware/auth.middleware');

module.exports = function createApiRoutes(simulator) {
  const router = express.Router();

  // Apply authentication parser to all routes
  router.use(verifyAuth);

  // GET /api/status - Live health and simulator clock
  router.get('/status', (req, res) => {
    res.json({
      status: 'online',
      simulatedTime: simulator.simulatedTime,
      speedMultiplier: simulator.speedMultiplier,
      isPaused: simulator.isPaused,
      tickCount: simulator.tickCount,
      zonesCount: simulator.zones.size,
      venuesCount: simulator.venues.size,
      edgesCount: simulator.transitEdges.size,
      activeAlertsCount: simulator.activeAlerts.length,
      activeRecommendationsCount: simulator.activeRecommendations.length,
      currentUser: req.user ? { email: req.user.email, role: req.user.role } : null,
    });
  });

  // GET /api/state - Full state payload
  router.get('/state', (req, res) => {
    res.json(simulator.getClientPayload());
  });

  // GET /api/zones - List all zones
  router.get('/zones', (req, res) => {
    res.json(Array.from(simulator.zones.values()));
  });

  // GET /api/venues - List all venues & events
  router.get('/venues', (req, res) => {
    res.json(Array.from(simulator.venues.values()));
  });

  // GET /api/transit - List all transit edges
  router.get('/transit', (req, res) => {
    res.json(Array.from(simulator.transitEdges.values()));
  });

  // GET /api/forecast - Current forecast output
  router.get('/forecast', (req, res) => {
    res.json(simulator.activeForecast);
  });

  // GET /api/alerts - Current active alerts
  router.get('/alerts', (req, res) => {
    res.json(simulator.activeAlerts);
  });

  // GET /api/recommendations - Current active recommendations
  router.get('/recommendations', (req, res) => {
    res.json(simulator.activeRecommendations);
  });

  // GET /api/audit-log - Chronological operational intervention logs
  router.get('/audit-log', (req, res) => {
    res.json(getAuditLogs());
  });

  // GET /api/history/snapshots - Historical timeline snapshots
  router.get('/history/snapshots', (req, res) => {
    const snapshots = simulator.historicalSnapshots || [];
    res.json(snapshots.slice(-20)); // Return last 20 snapshots
  });

  // GET /api/visitor/route - Route recommendation for attendees (Open to visitors)
  router.get('/visitor/route', (req, res) => {
    const { from, to, preference } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'Both from and to query params are required' });
    }
    const result = simulator.findOptimalRoute(from, to, preference);
    res.json(result);
  });

  // ---------------------------------------------------------------------------
  // PROTECTED ORGANIZER OPERATIONS (Requires 'organizer' role)
  // ---------------------------------------------------------------------------

  // POST /api/scenario - Update what-if parameters
  router.post('/scenario', requireRole('organizer'), async (req, res) => {
    const { demandSurgeMultiplier, eventStartTimeDeltas, transitCapacityDeltas } = req.body;
    const updated = simulator.updateScenario({
      ...(typeof demandSurgeMultiplier === 'number' && { demandSurgeMultiplier }),
      ...(eventStartTimeDeltas && { eventStartTimeDeltas }),
      ...(transitCapacityDeltas && { transitCapacityDeltas }),
    });

    await logAuditAction(
      req.user.email,
      'UPDATE_SCENARIO',
      { demandSurgeMultiplier, transitCapacityDeltas }
    );

    res.json({ success: true, whatIfOverrides: updated });
  });

  // POST /api/scenario/reset - Reset what-if parameters
  router.post('/scenario/reset', requireRole('organizer'), async (req, res) => {
    const reset = simulator.resetScenario();
    await logAuditAction(req.user.email, 'RESET_SCENARIO');
    res.json({ success: true, whatIfOverrides: reset });
  });

  // POST /api/control/clock - Pause/resume or change speed
  router.post('/control/clock', requireRole('organizer'), async (req, res) => {
    const { isPaused, speedMultiplier } = req.body;
    if (typeof isPaused === 'boolean') simulator.isPaused = isPaused;
    if (typeof speedMultiplier === 'number') simulator.speedMultiplier = speedMultiplier;

    await logAuditAction(
      req.user.email,
      'CLOCK_CONTROL',
      { isPaused: simulator.isPaused, speedMultiplier: simulator.speedMultiplier }
    );

    res.json({
      success: true,
      isPaused: simulator.isPaused,
      speedMultiplier: simulator.speedMultiplier,
    });
  });

  // POST /api/alerts/:id/action - Execute Incident Response Playbook action
  router.post('/alerts/:id/action', requireRole('organizer'), async (req, res) => {
    const { id } = req.params;
    const { actionType, details } = req.body;

    const alert = simulator.activeAlerts.find((a) => a.id === id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found or already resolved' });
    }

    let resultSummary = '';

    if (actionType === 'auto_reroute') {
      // Trigger immediate LP solver rebalance and shift transit capacity
      simulator.updateScenario({
        transitCapacityDeltas: { 'edge-hub-fanpark-shuttle': 4000, 'edge-promenade-walkway': 3000 }
      });
      alert.status = 'mitigating';
      resultSummary = 'Dynamic LP Simplex flow diversion activated across alternate corridors.';
    } else if (actionType === 'broadcast_advisory') {
      alert.status = 'mitigating';
      resultSummary = 'Advisory broadcast pushed to attendee companion feeds.';
    } else if (actionType === 'dispatch_stewards') {
      alert.status = 'mitigating';
      resultSummary = 'Crowd management stewards dispatched to affected zone.';
    } else if (actionType === 'resolve') {
      simulator.activeAlerts = simulator.activeAlerts.filter((a) => a.id !== id);
      resultSummary = 'Alert marked as fully resolved.';
    } else {
      resultSummary = `Operational intervention executed: ${actionType}`;
    }

    const log = await logAuditAction(req.user.email, `PLAYBOOK_${actionType.toUpperCase()}`, {
      alertId: id,
      actionType,
      summary: resultSummary,
      ...details,
    });

    res.json({
      success: true,
      alertId: id,
      summary: resultSummary,
      auditLog: log,
      alert,
    });
  });

  // POST /api/seed - Re-seed DB & rehydrate memory
  router.post('/seed', requireRole('organizer'), async (req, res) => {
    try {
      await simulator.seedDatabase();
      await simulator.initialize();
      await logAuditAction(req.user.email, 'RESEED_DATABASE');
      res.json({ success: true, message: 'Database reseeded and simulator hydrated successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
