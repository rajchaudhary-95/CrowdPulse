const express = require('express');

module.exports = function createApiRoutes(simulator) {
  const router = express.Router();

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

  // POST /api/scenario - Update what-if parameters
  router.post('/scenario', (req, res) => {
    const { demandSurgeMultiplier, eventStartTimeDeltas, transitCapacityDeltas } = req.body;
    const updated = simulator.updateScenario({
      ...(typeof demandSurgeMultiplier === 'number' && { demandSurgeMultiplier }),
      ...(eventStartTimeDeltas && { eventStartTimeDeltas }),
      ...(transitCapacityDeltas && { transitCapacityDeltas }),
    });
    res.json({ success: true, whatIfOverrides: updated });
  });

  // POST /api/scenario/reset - Reset what-if parameters
  router.post('/scenario/reset', (req, res) => {
    const reset = simulator.resetScenario();
    res.json({ success: true, whatIfOverrides: reset });
  });

  // POST /api/control/clock - Pause/resume or change speed
  router.post('/control/clock', (req, res) => {
    const { isPaused, speedMultiplier } = req.body;
    if (typeof isPaused === 'boolean') simulator.isPaused = isPaused;
    if (typeof speedMultiplier === 'number') simulator.speedMultiplier = speedMultiplier;
    res.json({
      success: true,
      isPaused: simulator.isPaused,
      speedMultiplier: simulator.speedMultiplier,
    });
  });

  // GET /api/visitor/route - Route recommendation for attendees
  router.get('/visitor/route', (req, res) => {
    const { from, to, preference } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'Both from and to query params are required' });
    }
    const result = simulator.findOptimalRoute(from, to, preference);
    res.json(result);
  });

  // POST /api/seed - Re-seed DB & rehydrate memory
  router.post('/seed', async (req, res) => {
    try {
      await simulator.seedDatabase();
      await simulator.initialize();
      res.json({ success: true, message: 'Database reseeded and simulator hydrated successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
