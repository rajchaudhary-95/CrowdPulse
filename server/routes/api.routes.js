const express = require('express');
const { verifyAuth, requireRole, logAuditAction, getAuditLogs, clearAuditLogs } = require('../middleware/auth.middleware');

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

  // GET /api/visitor/egress-window - Optimal travel & exit window recommendation
  router.get('/visitor/egress-window', (req, res) => {
    const advisory = simulator.getEgressAdvisory();
    res.json(advisory);
  });

  // GET /api/visitor/concessions - Live concourse discovery hub ("Skip the Queues")
  router.get('/visitor/concessions', (req, res) => {
    const { category } = req.query;
    const concessions = simulator.getConcessions(category);
    res.json(concessions);
  });

  // GET /api/visitor/wait-times - Zone and facility wait times radar
  router.get('/visitor/wait-times', (req, res) => {
    const waitTimes = simulator.getFacilityWaitTimes();
    res.json(waitTimes);
  });

  // GET /api/visitor/announcements - Active safety & schedule announcements
  router.get('/visitor/announcements', (req, res) => {
    res.json(simulator.getAnnouncements());
  });

  // POST /api/visitor/announcements - Broadcast safety advisory (organizer role or test)
  router.post('/visitor/announcements', async (req, res) => {
    const { title, message, severity, targetZoneId } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Announcement message is required' });
    }
    const announcement = simulator.broadcastAnnouncement({
      title,
      message,
      severity,
      targetZoneId,
      author: req.user?.email || 'Alegria Command Center',
    });

    if (req.user?.email) {
      await logAuditAction(req.user.email, 'BROADCAST_ANNOUNCEMENT', { announcementId: announcement._id, title });
    }

    res.json({ success: true, announcement });
  });

  // POST /api/visitor/reminders - Set departure or event reminder
  router.post('/visitor/reminders', (req, res) => {
    const { title, targetTime, reminderType } = req.body;
    const userIdentifier = req.user?.email || req.headers['x-session-id'] || 'visitor-session';
    const reminder = simulator.addReminder({
      userIdentifier,
      title,
      targetTime,
      reminderType,
    });
    res.json({ success: true, reminder });
  });

  // GET /api/visitor/reminders - Get user's active reminders
  router.get('/visitor/reminders', (req, res) => {
    const userIdentifier = req.user?.email || req.headers['x-session-id'] || 'visitor-session';
    const reminders = simulator.getReminders(userIdentifier);
    res.json(reminders);
  });

  // POST /api/visitor/bookmarks - Toggle bookmark on a concession
  router.post('/visitor/bookmarks', (req, res) => {
    const { concessionId } = req.body;
    const userIdentifier = req.user?.email || req.headers['x-session-id'] || 'visitor-session';
    if (!concessionId) {
      return res.status(400).json({ error: 'concessionId is required' });
    }
    const result = simulator.toggleBookmark(userIdentifier, concessionId);
    res.json(result);
  });

  // GET /api/visitor/bookmarks - Get bookmarked concession IDs
  router.get('/visitor/bookmarks', (req, res) => {
    const userIdentifier = req.user?.email || req.headers['x-session-id'] || 'visitor-session';
    const bookmarkedIds = simulator.getBookmarks(userIdentifier);
    res.json({ userIdentifier, bookmarkedIds });
  });

  // GET /api/zones/:id/telemetry - Deep-dive sensor telemetry for a zone
  router.get('/zones/:id/telemetry', (req, res) => {
    const { id } = req.params;
    const telemetry = simulator.getZoneTelemetry(id);
    if (telemetry.error) {
      return res.status(404).json(telemetry);
    }
    res.json(telemetry);
  });

  // ---------------------------------------------------------------------------
  // PROTECTED ORGANIZER OPERATIONS (Requires 'organizer' role)
  // ---------------------------------------------------------------------------

  // POST /api/scenario - Update what-if parameters
  router.post('/scenario', requireRole('organizer'), async (req, res) => {
    const { demandSurgeMultiplier, eventStartTimeDeltas, transitCapacityDeltas, actionDescription } = req.body;
    const updated = simulator.updateScenario({
      ...(typeof demandSurgeMultiplier === 'number' && { demandSurgeMultiplier }),
      ...(eventStartTimeDeltas && { eventStartTimeDeltas }),
      ...(transitCapacityDeltas && { transitCapacityDeltas }),
    });

    let action = 'UPDATE_SCENARIO';
    let summary = actionDescription || 'Updated simulation scenario parameters';
    if (transitCapacityDeltas) {
      const mult = transitCapacityDeltas['edge-depot-maingate'] || 1.4;
      const boostPct = Math.round((mult - 1) * 100);
      action = `BOOST_SHUTTLES_${boostPct}%`;
      summary = actionDescription || `+${boostPct}% Transit Shuttle Capacity deployed (Panvel Station ⇄ Campus Gates)`;
    } else if (eventStartTimeDeltas) {
      action = 'STAGGER_EGRESS';
      summary = actionDescription || 'Staggered main stage egress timing (+30m offset)';
    } else if (typeof demandSurgeMultiplier === 'number') {
      action = 'ADJUST_DEMAND_SURGE';
      summary = actionDescription || `Crowd demand surge adjusted to ${demandSurgeMultiplier}x`;
    }

    const log = await logAuditAction(
      req.user.email,
      action,
      {
        summary,
        demandSurgeMultiplier,
        transitCapacityDeltas,
        eventStartTimeDeltas,
      }
    );

    res.json({ success: true, whatIfOverrides: updated, auditLog: log });
  });

  // POST /api/scenario/reset - Reset what-if parameters
  router.post('/scenario/reset', requireRole('organizer'), async (req, res) => {
    const reset = simulator.resetScenario();
    const log = await logAuditAction(req.user.email, 'RESET_SCENARIO', {
      summary: 'Reset all active scenario overrides back to live operational baseline.',
    });
    res.json({ success: true, whatIfOverrides: reset, auditLog: log });
  });

  // GET /api/gates/status - Real-time gate operational modes (Ingress vs Egress)
  router.get('/gates/status', (req, res) => {
    const operationalState = simulator.getFestivalOperationalState();
    const gates = simulator.getGateStatuses();
    res.json({ operationalState, gates });
  });

  // POST /api/control/clock - Pause/resume, speed, simulated time scrubbing, or phase jumps
  router.post('/control/clock', async (req, res) => {
    const { isPaused, speedMultiplier, simulatedTime, setPhase, targetHour, gateOverrides } = req.body;
    if (typeof isPaused === 'boolean') simulator.isPaused = isPaused;
    if (typeof speedMultiplier === 'number') simulator.speedMultiplier = speedMultiplier;

    let timeUpdated = false;
    if (simulatedTime || typeof targetHour === 'number' || setPhase || gateOverrides) {
      simulator.setTimeOrPhase({ simulatedTime, targetHour, setPhase, gateOverrides });
      timeUpdated = true;
    }

    const currentPhase = simulator.getFestivalOperationalState();
    let actionType = 'CLOCK_CONTROL';
    let summaryText = `Simulation clock ${simulator.isPaused ? 'paused' : 'running'} at ${simulator.speedMultiplier}x speed`;

    if (setPhase) {
      actionType = `PHASE_TRANSITION_${setPhase}`;
      summaryText = `Shifted simulation operational timeline to ${currentPhase.phaseLabel} (${currentPhase.gateMode})`;
    } else if (simulatedTime || typeof targetHour === 'number') {
      actionType = 'TIMELINE_SCRUB';
      summaryText = `Scrubbed festival time to ${currentPhase.timeFormatted} (${currentPhase.phaseLabel})`;
    } else if (gateOverrides) {
      actionType = 'GATE_MODE_OVERRIDE';
      summaryText = `Manual turnstile override applied to campus gates: ${Object.keys(gateOverrides).join(', ')}`;
    }

    const userEmail = req.user?.email || 'attendee@crowdpulse.io';
    const log = await logAuditAction(
      userEmail,
      actionType,
      {
        summary: summaryText,
        isPaused: simulator.isPaused,
        speedMultiplier: simulator.speedMultiplier,
        simulatedTime: simulator.simulatedTime,
        phase: currentPhase.phase,
      }
    );

    if (simulator.io) {
      simulator.io.emit('live:tick', simulator.getClientPayload());
    }

    res.json({
      success: true,
      isPaused: simulator.isPaused,
      speedMultiplier: simulator.speedMultiplier,
      simulatedTime: simulator.simulatedTime,
      festivalPhase: currentPhase,
      gateStatuses: simulator.getGateStatuses(),
      auditLog: log,
    });
  });

  // POST /api/control/gates/toggle - Toggle specific gate between Entry, Exit, and Emergency modes
  router.post('/control/gates/toggle', async (req, res) => {
    const { gateId, targetMode } = req.body;
    if (!gateId) {
      return res.status(400).json({ error: 'gateId is required' });
    }

    simulator.whatIfOverrides.gateOverrides = {
      ...(simulator.whatIfOverrides.gateOverrides || {}),
      [gateId]: targetMode,
    };

    simulator.evaluateIntelligence();
    if (simulator.io) {
      simulator.io.emit('live:tick', simulator.getClientPayload());
    }

    const userEmail = req.user?.email || 'attendee@crowdpulse.io';
    const log = await logAuditAction(
      userEmail,
      'GATE_TURNSTILE_OVERRIDE',
      {
        summary: `Manually set ${gateId} operational mode to ${targetMode}`,
        gateId,
        targetMode,
      }
    );

    res.json({
      success: true,
      gateStatuses: simulator.getGateStatuses(),
      auditLog: log,
    });
  });

  // POST /api/alerts/:id/action - Execute Incident Response Playbook action
  router.post('/alerts/:id/action', requireRole('organizer'), async (req, res) => {
    const { id } = req.params;
    const { actionType, details } = req.body;

    let alert = simulator.activeAlerts.find((a) => a.id === id);
    if (!alert) {
      alert = {
        id,
        sector: 'SEC-01',
        title: 'Main Arena Turnstiles Congestion',
        status: 'active',
      };
    }

    let resultSummary = '';

    if (actionType === 'auto_reroute') {
      // Trigger immediate LP solver rebalance and shift transit capacity
      simulator.updateScenario({
        transitCapacityDeltas: {
          'edge-depot-maingate': 1.4,
          'edge-sports-bypass': 1.8,
        },
      });
      // Directly relieve pressure on quadrangle and main ground
      const qz = simulator.zones.get('zone-quadrangle');
      if (qz) {
        qz.liveMetrics.compositeStressScore = Math.max(45, qz.liveMetrics.compositeStressScore - 18);
        qz.liveMetrics.currentTransitPressure = Math.max(0.3, qz.liveMetrics.currentTransitPressure - 0.2);
      }
      const mg = simulator.transitEdges.get('edge-quad-mainground');
      if (mg) {
        mg.liveStatus.utilizationRate = 0.62;
        mg.liveStatus.congestionLevel = 'moderate';
      }
      alert.status = 'mitigating';
      resultSummary = 'Rerouted 1,250 attendees via PICA Lawn Sports Ground Bypass (-18% concourse choke).';
    } else if (actionType === 'broadcast_advisory' || actionType === 'push_advisory') {
      alert.status = 'mitigating';
      resultSummary = 'Emergency advisory broadcast dispatched to attendee mobile feeds.';
      simulator.broadcastAnnouncement({
        title: 'Corridor Safety Advisory',
        message: 'High volume detected near Sector turnstiles. Please follow marshals to bypass corridors.',
        severity: 'warning',
      });
    } else if (actionType === 'dispatch_stewards') {
      alert.status = 'mitigating';
      const mz = simulator.zones.get('zone-quadrangle') || simulator.zones.get('zone-main-ground');
      if (mz) {
        mz.liveMetrics.compositeStressScore = Math.max(40, mz.liveMetrics.compositeStressScore - 15);
      }
      resultSummary = '8 Crowd Marshals & Security Stewards dispatched to sector bottleneck.';
    } else if (actionType === 'resolve') {
      simulator.activeAlerts = simulator.activeAlerts.filter((a) => a.id !== id);
      resultSummary = 'Alert marked as fully resolved and cleared from active sector breaches.';
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

  // DELETE /api/audit-log - Clear audit logs
  router.delete('/audit-log', requireRole('organizer'), async (req, res) => {
    clearAuditLogs();
    res.json({ success: true, message: 'Audit logs cleared successfully.' });
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
