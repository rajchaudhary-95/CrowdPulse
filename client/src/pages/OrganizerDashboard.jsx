import React, { useState, useEffect } from 'react';
import MetricsHeader from '../components/MetricsHeader';
import MapView from '../components/MapView';
import AlertsFeed from '../components/AlertsFeed';
import OptimizationPanel from '../components/OptimizationPanel';
import WhatIfDrawer from '../components/WhatIfDrawer';
import {
  Table,
  RotateCcw,
  Clock,
  Bus,
  Megaphone,
  Activity,
  CheckCircle2,
  CheckCircle,
  X,
  Radio,
  Eye,
  ClipboardList,
  RefreshCw,
  Trash2,
  Sliders,
  Check,
} from 'lucide-react';
import { fetchZoneTelemetry, broadcastAnnouncement, fetchAuditLogs, clearAuditLogs } from '../services/api';

export default function OrganizerDashboard({
  zones = [],
  venues = [],
  transitEdges = [],
  alerts = [],
  recommendations = [],
  forecast = {},
  whatIfOverrides = {},
  onUpdateScenario,
  onResetScenario,
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [showZoneMatrix, setShowZoneMatrix] = useState(true);

  // Dynamic Shuttle Fleet Scaling State
  const [customShuttlePct, setCustomShuttlePct] = useState(40);
  const [showShuttlePopover, setShowShuttlePopover] = useState(false);

  // Deep-Dive Telemetry & Broadcast State
  const [zoneTelemetry, setZoneTelemetry] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    severity: 'info',
    targetZoneId: '',
  });
  const [broadcastToast, setBroadcastToast] = useState(null);

  // Fetch telemetry whenever selectedZoneId changes
  useEffect(() => {
    let isMounted = true;
    async function loadTelemetry() {
      if (!selectedZoneId) {
        setZoneTelemetry(null);
        return;
      }
      setLoadingTelemetry(true);
      try {
        const data = await fetchZoneTelemetry(selectedZoneId);
        if (isMounted) setZoneTelemetry(data);
      } catch (err) {
        console.warn('Telemetry fetch error:', err);
      } finally {
        if (isMounted) setLoadingTelemetry(false);
      }
    }
    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, [selectedZoneId]);

  // Operations Activity & Audit Log State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL');

  const loadAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const logs = await fetchAuditLogs();
      if (Array.isArray(logs)) {
        setAuditLogs(logs);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    const interval = setInterval(loadAuditLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAuditLogs = async () => {
    try {
      await clearAuditLogs();
      setAuditLogs([]);
      setBroadcastToast('Audit history log cleared successfully.');
      setTimeout(() => setBroadcastToast(null), 3500);
    } catch (err) {
      setBroadcastToast(`Clear error: ${err.message}`);
      setTimeout(() => setBroadcastToast(null), 3500);
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastForm.message) return;
    try {
      await broadcastAnnouncement(broadcastForm);
      setBroadcastToast(`📢 Announcement "${broadcastForm.title || 'Advisory'}" dispatched to attendee feeds.`);
      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', message: '', severity: 'info', targetZoneId: '' });
      setTimeout(() => setBroadcastToast(null), 5000);
      loadAuditLogs();
    } catch (err) {
      setBroadcastToast(`Broadcast error: ${err.message}`);
      setTimeout(() => setBroadcastToast(null), 5000);
    }
  };

  // Keyboard shortcut listener (Escape to clear selected zone)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        setSelectedZoneId(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickIntervention = async (type, customValue) => {
    try {
      if (type === 'boost_shuttles') {
        const pct = typeof customValue === 'number' ? customValue : customShuttlePct;
        const multiplier = Number((1 + pct / 100).toFixed(2));
        await onUpdateScenario({
          transitCapacityDeltas: {
            'edge-depot-maingate': multiplier,
            'edge-depot-canteengate': multiplier,
          },
          actionDescription: `+${pct}% Transit Shuttle Capacity deployed to Sector 16 Auto Loop & Gate 1/2`,
        });
        const boostedLimit = Math.round(3000 * multiplier).toLocaleString();
        setBroadcastToast(`🚌 +${pct}% Shuttle Capacity deployed! Sector 16 limit expanded to ${boostedLimit} & crowd backlog cleared.`);
      } else if (type === 'offset_events') {
        await onUpdateScenario({
          eventStartTimeDeltas: {
            'evt-alegria-edm-night': 30,
            'evt-alegria-flashmob': 30,
          },
          actionDescription: 'Staggered EDM and Flashmob egress schedules (+30m offset)',
        });
        setBroadcastToast('⏱️ Egress staggered (+30m)! Main stage peak exit wave diffused.');
      } else if (type === 'reset_all') {
        await onResetScenario();
        setBroadcastToast('↺ All scenario overrides reset to live operational baseline.');
      }
      setTimeout(() => setBroadcastToast(null), 5000);
      loadAuditLogs();
    } catch (err) {
      setBroadcastToast(`Action failed: ${err.message}`);
      setTimeout(() => setBroadcastToast(null), 5000);
    }
  };

  const handleOptimizationApply = async () => {
    try {
      await onUpdateScenario({
        transitCapacityDeltas: {
          'edge-depot-maingate': 1.4,
          'edge-sports-bypass': 1.8,
        },
        actionDescription: 'Rerouted 1,250 attendees via PICA Lawn Sports Ground Bypass (-18% concourse choke)',
      });
      setBroadcastToast('🔄 Simplex Flow Applied: 1,250 attendees rerouted via Sports Ground bypass! Choke relieved.');
      setTimeout(() => setBroadcastToast(null), 5000);
      loadAuditLogs();
    } catch (err) {
      setBroadcastToast(`Optimization failed: ${err.message}`);
      setTimeout(() => setBroadcastToast(null), 5000);
    }
  };

  const handleAlertActionExecuted = (alertId, actionType, summary) => {
    setBroadcastToast(`⚡ Incident Action: ${summary}`);
    setTimeout(() => setBroadcastToast(null), 5000);
    loadAuditLogs();
  };

  const getActionBadge = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('SHUTTLE') || act.includes('BOOST')) {
      return { label: 'SHUTTLE BOOST', icon: '🚌', colorClass: 'chip-cyan' };
    }
    if (act.includes('REROUTE') || act.includes('FLOW')) {
      return { label: 'ATTENDEE REROUTE', icon: '🔄', colorClass: 'chip-emerald' };
    }
    if (act.includes('EGRESS') || act.includes('STAGGER') || act.includes('OFFSET')) {
      return { label: 'STAGGER EGRESS', icon: '⏱️', colorClass: 'chip-purple' };
    }
    if (act.includes('BROADCAST') || act.includes('ANNOUNCEMENT')) {
      return { label: 'BROADCAST ADVISORY', icon: '📢', colorClass: 'chip-amber' };
    }
    if (act.includes('STEWARDS')) {
      return { label: 'STEWARDS DISPATCHED', icon: '🛡️', colorClass: 'chip-indigo' };
    }
    if (act.includes('RESOLVE')) {
      return { label: 'ALERT RESOLVED', icon: '✅', colorClass: 'chip-green' };
    }
    if (act.includes('RESET')) {
      return { label: 'SCENARIO RESET', icon: '↺', colorClass: 'chip-slate' };
    }
    if (act.includes('SURGE') || act.includes('SCENARIO') || act.includes('CLOCK')) {
      return { label: 'SIMULATION PARAMS', icon: '📊', colorClass: 'chip-blue' };
    }
    return { label: action.replace(/_/g, ' '), icon: '⚡', colorClass: 'chip-slate' };
  };

  const formatAuditTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const getFallbackSummary = (log) => {
    const act = (log.action || '').toUpperCase();
    if (act.includes('BOOST') || act.includes('SHUTTLE')) {
      const match = act.match(/(\d+)%/);
      const pct = match ? match[1] : '40';
      return `Deployed +${pct}% Transit Shuttle Capacity between Panvel Station and Campus Gates 1 & 2.`;
    }
    if (act.includes('STAGGER')) {
      return 'Shifted concert stage end-times by +30m to avoid post-event concourse crush.';
    }
    if (act.includes('RESET')) {
      return 'Reset all active scenario overrides back to live operational baseline.';
    }
    if (act.includes('RESEED')) {
      return 'Reseeded and hydrated system database with verified Alegria dataset.';
    }
    return 'Operational action executed by authorized incident commander.';
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter === 'ALL') return true;
    const act = (log.action || '').toUpperCase();
    const summary = (log.details?.summary || '').toUpperCase();
    if (auditFilter === 'SHUTTLES & REROUTES') {
      return act.includes('SHUTTLE') || act.includes('REROUTE') || act.includes('FLOW') || summary.includes('SHUTTLE') || summary.includes('REROUTE');
    }
    if (auditFilter === 'SCHEDULE & TIMING') {
      return act.includes('EGRESS') || act.includes('STAGGER') || act.includes('OFFSET') || act.includes('CLOCK') || summary.includes('EGRESS') || summary.includes('STAGGER');
    }
    if (auditFilter === 'BROADCASTS & ADVISORIES') {
      return act.includes('BROADCAST') || act.includes('ANNOUNCEMENT') || summary.includes('BROADCAST') || summary.includes('ADVISORY');
    }
    if (auditFilter === 'PLAYBOOKS & ALERTS') {
      return act.includes('PLAYBOOK') || act.includes('RESOLVE') || act.includes('STEWARDS') || summary.includes('STEWARD') || summary.includes('ALERT');
    }
    return true;
  });

  // Structured default zones to match screenshot precision
  // Structured default zones to match Pillai Alegria layout
  const displayZones = zones.length > 0 ? zones : [
    {
      id: 'zone-main-ground',
      name: 'Alegria Main Concert Ground',
      category: 'Concert Arena',
      currentOccupancy: 5850,
      capacityLimit: 7000,
      transitPressure: 92,
      stressScore: 88,
      status: 'CRITICAL',
    },
    {
      id: 'zone-quadrangle',
      name: 'The Central Quadrangle (The Quad)',
      category: 'Central Hub & Flashmob',
      currentOccupancy: 1850,
      capacityLimit: 2500,
      transitPressure: 68,
      stressScore: 66,
      status: 'ELEVATED',
    },
    {
      id: 'zone-canteen-back',
      name: 'Campus Canteen & Boys Gate 2',
      category: 'Boys Entry & Food Stalls',
      currentOccupancy: 1100,
      capacityLimit: 1800,
      transitPressure: 48,
      stressScore: 46,
      status: 'NORMAL',
    },
    {
      id: 'zone-atrium-main',
      name: 'Engineering Atrium & Girls/Artist Gate 1',
      category: 'Main Entry Turnstiles',
      currentOccupancy: 1350,
      capacityLimit: 2000,
      transitPressure: 54,
      stressScore: 52,
      status: 'NORMAL',
    },
    {
      id: 'zone-sports-ground',
      name: 'PICA Lawn & Sports Ground',
      category: 'Auxiliary Lawns & Acoustic Stage',
      currentOccupancy: 550,
      capacityLimit: 2000,
      transitPressure: 22,
      stressScore: 24,
      status: 'NORMAL',
    },
    {
      id: 'zone-panvel-transit',
      name: 'Panvel Station & Sector 16 Transit Hub',
      category: 'Auto Stand & Bus Feeder',
      currentOccupancy: 2200,
      capacityLimit: 3000,
      transitPressure: 65,
      stressScore: 58,
      status: 'NORMAL',
    },
  ];

  return (
    <div className="organizer-view">
      {/* Sub-Header Operational Strip */}
      <div className="command-sub-bar">
        <div className="meta-strip-left font-mono">
          <span className="live-dot-green"></span>
          <span className="bold-white">PILLAI ALEGRIA COMMAND CENTER</span>
          <span className="sep">|</span>
          <span>CAMPUS: NEW PANVEL SEC-16</span>
          <span className="sep">|</span>
          <span>PEAK CONCURRENCY: 10,000 CAP</span>
        </div>

        <div className="quick-interventions-row">
          <span className="interventions-label font-mono">QUICK INTERVENTIONS:</span>
          {/* Dynamic Shuttle Scaling Popover & Quick Trigger */}
          <div className="shuttle-control-wrapper">
            <button
              className={`btn-intervention font-mono ${showShuttlePopover ? 'active' : ''}`}
              onClick={() => setShowShuttlePopover(!showShuttlePopover)}
              title="Click to scale shuttle fleet capacity percentage dynamically"
            >
              <span>🚌</span>
              <span>+{customShuttlePct}% SHUTTLES</span>
              <Sliders size={12} className="text-cyan" />
            </button>

            {showShuttlePopover && (
              <div className="shuttle-popover glass-panel">
                <div className="shuttle-popover-header">
                  <div className="popover-title-row font-mono">
                    <Bus size={14} className="text-secondary" />
                    <span>DYNAMIC SHUTTLE FLEET SCALING</span>
                  </div>
                  <button
                    type="button"
                    className="popover-close-btn"
                    onClick={() => setShowShuttlePopover(false)}
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="shuttle-popover-body">
                  <div className="popover-pct-display">
                    <span className="pct-number font-display text-cyan">+{customShuttlePct}%</span>
                    <span className="pct-label font-mono">FLEET CAPACITY BOOST</span>
                  </div>

                  {/* Slider Control */}
                  <div className="popover-slider-group">
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={customShuttlePct}
                      onChange={(e) => setCustomShuttlePct(parseInt(e.target.value, 10))}
                      className="clean-slider"
                    />
                    <div className="slider-range-labels font-mono">
                      <span>+10%</span>
                      <span>+75%</span>
                      <span>+150%</span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="popover-presets-grid font-mono">
                    {[20, 40, 60, 80, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`btn-preset-chip ${customShuttlePct === val ? 'active' : ''}`}
                        onClick={() => setCustomShuttlePct(val)}
                      >
                        +{val}%
                      </button>
                    ))}
                  </div>

                  {/* Real-time Impact Preview */}
                  <div className="popover-impact-preview font-mono">
                    <div className="impact-row">
                      <span className="impact-k">Panvel Station Limit:</span>
                      <span className="impact-v text-cyan">3,000 → {Math.round(3000 * (1 + customShuttlePct / 100)).toLocaleString()}</span>
                    </div>
                    <div className="impact-row">
                      <span className="impact-k">Est. Crowd Backlog Clearance:</span>
                      <span className="impact-v text-success">~{Math.round(2262 * (1 - 1 / (1 + customShuttlePct / 100))).toLocaleString()} attendees</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="popover-actions-row font-mono">
                    <button
                      type="button"
                      className="btn-popover-apply"
                      onClick={() => {
                        handleQuickIntervention('boost_shuttles', customShuttlePct);
                        setShowShuttlePopover(false);
                      }}
                    >
                      <Check size={14} />
                      <span>Deploy +{customShuttlePct}% Shuttles</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            className="btn-intervention font-mono"
            onClick={() => handleQuickIntervention('offset_events')}
          >
            <span>⏱️</span>
            <span>STAGGER EGRESS (+30m)</span>
          </button>
          <button
            className="btn-intervention font-mono"
            onClick={() => handleQuickIntervention('reset_all')}
          >
            <span>↺</span>
            <span>RESET</span>
          </button>

          <button
            className="btn-intervention font-mono highlight-broadcast"
            onClick={() => setShowBroadcastModal(true)}
            title="Broadcast Live Announcement to Attendees"
          >
            <Megaphone size={13} className="text-cyan" />
            <span>BROADCAST ALERT</span>
          </button>

          <div className="strip-divider"></div>

          <button
            className={`btn-intervention font-mono ${showZoneMatrix ? 'active' : ''}`}
            onClick={() => setShowZoneMatrix(!showZoneMatrix)}
          >
            <Table size={13} />
            <span>ZONE MATRIX</span>
          </button>
        </div>
      </div>

      {/* Broadcast Toast Feedback */}
      {broadcastToast && (
        <div className="broadcast-toast-strip font-mono">
          <CheckCircle2 size={15} className="text-success" />
          <span>{broadcastToast}</span>
        </div>
      )}

      {/* Broadcast Advisory Modal */}
      {showBroadcastModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="broadcast-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header font-mono">
              <div className="header-left">
                <Megaphone size={18} className="text-cyan" />
                <span className="modal-title font-display">Broadcast Safety / Ops Advisory</span>
              </div>
              <button className="btn-modal-close" onClick={() => setShowBroadcastModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="broadcast-form font-mono">
              <div className="form-group">
                <label>ADVISORY TITLE</label>
                <input
                  type="text"
                  placeholder="e.g., Gate 2 Boys Queue Clear, South Lawn Exit Flow"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  required
                  className="clean-input"
                />
              </div>

              <div className="form-group">
                <label>TARGET SECTOR / ZONE</label>
                <select
                  value={broadcastForm.targetZoneId}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetZoneId: e.target.value })}
                  className="clean-select"
                >
                  <option value="">All Sectors (Campus-Wide Push)</option>
                  {displayZones.map((z) => (
                    <option key={z._id || z.id} value={z._id || z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>SEVERITY LEVEL</label>
                <select
                  value={broadcastForm.severity}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, severity: e.target.value })}
                  className="clean-select"
                >
                  <option value="info">Informational (Advisory)</option>
                  <option value="warning">Elevated Warning</option>
                  <option value="urgent">Urgent Safety / Chokepoint Action</option>
                </select>
              </div>

              <div className="form-group">
                <label>MESSAGE TEXT (PUSHED TO ATTENDEE COMPANION)</label>
                <textarea
                  placeholder="Enter clear, actionable instructions for attendees..."
                  rows={3}
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  required
                  className="clean-textarea"
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-cancel font-mono"
                  onClick={() => setShowBroadcastModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit font-mono">
                  <Megaphone size={14} />
                  <span>Dispatch Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Zone Deep-Dive Telemetry Inspector */}
      {selectedZoneId && zoneTelemetry && (
        <div className="telemetry-inspector-drawer glass-panel font-mono">
          <div className="inspector-header">
            <div className="inspector-title-group">
              <Activity size={16} className="text-cyan" />
              <span className="inspector-title font-display">{zoneTelemetry.name}</span>
              <span className="telemetry-pill">DEEP-DIVE SENSOR TELEMETRY</span>
            </div>
            <button className="btn-inspector-close" onClick={() => setSelectedZoneId(null)}>
              <X size={15} />
            </button>
          </div>

          <div className="inspector-grid">
            <div className="inspector-stat-box">
              <span className="stat-label">HEADCOUNT / CAP</span>
              <span className="stat-val font-display">
                {zoneTelemetry.occupancy?.current?.toLocaleString()} / {zoneTelemetry.occupancy?.maxCapacity?.toLocaleString()}
              </span>
              <span className="stat-sub">{zoneTelemetry.occupancy?.utilizationPct}% Utilization</span>
            </div>

            <div className="inspector-stat-box">
              <span className="stat-label">INGRESS / EGRESS FLOW</span>
              <span className="stat-val font-display">
                +{zoneTelemetry.flowDynamics?.ingressRatePerMin} / -{zoneTelemetry.flowDynamics?.egressRatePerMin} <small>p/min</small>
              </span>
              <span className="stat-sub">Speed: {zoneTelemetry.flowDynamics?.pedestrianVelocityMps} m/s</span>
            </div>

            <div className="inspector-stat-box">
              <span className="stat-label">SENSOR MESH HEALTH</span>
              <span className="stat-val font-display text-success">
                {zoneTelemetry.sensorHealth?.opticalCamerasActive} Cams • {zoneTelemetry.sensorHealth?.lidarSensorsActive} LiDAR
              </span>
              <span className="stat-sub">Uptime: {zoneTelemetry.sensorHealth?.meshNodeUptimePct}% • 5s Pulse</span>
            </div>

            <div className="inspector-stat-box">
              <span className="stat-label">COMPOSITE STRESS</span>
              <span className="stat-val font-display text-warning">
                {zoneTelemetry.compositeStress?.score} / 100
              </span>
              <span className="stat-sub">Status: {zoneTelemetry.compositeStress?.status?.toUpperCase()}</span>
            </div>
          </div>

          {zoneTelemetry.notes && (
            <div className="inspector-notes-row">
              <span>💡</span>
              <span><strong>Operational Notes:</strong> {zoneTelemetry.notes}</span>
            </div>
          )}
        </div>
      )}

      <div className="dashboard-content-body">
        {/* Row 1: 4 Executive KPI Cards */}
        <MetricsHeader
          zones={zones}
          transitEdges={transitEdges}
          alerts={alerts}
          forecast={forecast}
        />

        {/* Row 2: Asymmetric Intelligence Split (Map 60% : Intelligence Feeds 40%) */}
        <div className="intelligence-split-grid">
          {/* Left 60%: Tactical Geospatial Vector Radar */}
          <div className="map-block">
            <MapView
              zones={zones}
              transitEdges={transitEdges}
              venues={venues}
              forecast={forecast}
              selectedZoneId={selectedZoneId}
              onSelectZone={setSelectedZoneId}
              isVisitorView={false}
            />
          </div>

          {/* Right 40%: Simplex Flow Optimizer + Active Sector Breaches */}
          <div className="feeds-block">
            <OptimizationPanel
              recommendations={recommendations}
              onSelectZone={setSelectedZoneId}
              onApplyAllRecommendations={handleOptimizationApply}
            />
            <AlertsFeed
              alerts={alerts}
              onSelectZone={setSelectedZoneId}
              onAlertActionExecuted={handleAlertActionExecuted}
            />
          </div>
        </div>

        {/* Row 3: Perimeter Telemetry Matrix (Collapsible Table) */}
        {showZoneMatrix && (
          <div className="perimeter-matrix-card glass-panel" id="perimeter-matrix">
            <div className="matrix-header">
              <div className="matrix-title-group">
                <Table size={16} className="text-secondary" />
                <h3 className="matrix-title">Perimeter Telemetry Matrix</h3>
                <span className="active-sectors-pill font-mono">{displayZones.length} ACTIVE SECTORS</span>
              </div>
              <div className="polling-rate font-mono">
                <span className="pulse-dot-cyan-sm"></span>
                <span>POLLING CYCLE: 1000ms</span>
              </div>
            </div>

            <div className="matrix-table-wrap font-mono">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>ZONE NAME</th>
                    <th>CATEGORY</th>
                    <th>OCCUPANCY VS LIMIT</th>
                    <th>TRANSIT PRESSURE</th>
                    <th>STRESS (0-100)</th>
                    <th>STATUS PILL</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {displayZones.map((z) => {
                    const zid = z._id || z.id;
                    const isTransitHub = zid === 'zone-panvel-transit' || z.category === 'transit_hub';
                    const shuttleDelta = whatIfOverrides?.transitCapacityDeltas?.['edge-depot-maingate'];
                    const shuttleMultiplier = typeof shuttleDelta === 'number'
                      ? (shuttleDelta > 10 ? shuttleDelta / 4000 : shuttleDelta)
                      : 1.0;
                    const isShuttleBoosted = isTransitHub && shuttleMultiplier > 1.0;

                    let baseOcc = z.liveMetrics?.currentVenueOccupancy ?? z.currentOccupancy ?? 2200;
                    let baseCap = z.totalCapacity?.venue ?? z.capacityLimit ?? 3000;

                    let occ = baseOcc;
                    let cap = baseCap;

                    if (isShuttleBoosted) {
                      // Boost throughput capacity limit (+40%)
                      cap = Math.round(baseCap * shuttleMultiplier);
                      // Actively clear waiting queue, decreasing occupancy
                      occ = Math.max(150, Math.round(baseOcc / shuttleMultiplier));
                    }

                    const pct = Math.min(100, Math.round((occ / cap) * 100));
                    let transitPress = z.liveMetrics?.currentTransitPressure ? Math.round(z.liveMetrics.currentTransitPressure * 100) : (z.transitPressure ?? 55);
                    if (isShuttleBoosted) {
                      transitPress = Math.max(12, Math.round(transitPress / shuttleMultiplier));
                    }
                    let stress = z.liveMetrics?.compositeStressScore ?? z.stressScore ?? 55;
                    if (isShuttleBoosted) {
                      stress = Math.max(25, Math.round(stress * 0.6));
                    }
                    const status = stress >= 85 ? 'CRITICAL' : stress >= 50 ? 'ELEVATED' : 'NORMAL';
                    const isSelected = selectedZoneId === zid;

                    const isCrit = stress >= 85 || status === 'CRITICAL';
                    const isElev = (stress >= 50 && stress < 85) || status === 'ELEVATED';

                    return (
                      <tr
                        key={zid}
                        className={isSelected ? 'selected-row' : ''}
                        onClick={() => setSelectedZoneId(zid)}
                      >
                        <td className="zone-name-cell">
                          <span className={`status-dot ${isCrit ? 'dot-red' : isElev ? 'dot-amber' : 'dot-green'}`}></span>
                          <span className="zone-bold-name">{z.name}</span>
                          {isShuttleBoosted && (
                            <span className="shuttle-active-pill font-mono">
                              🚌 +{Math.round((shuttleMultiplier - 1) * 100)}% SHUTTLES
                            </span>
                          )}
                        </td>
                        <td className="zone-category-cell">{z.category}</td>
                        <td className="zone-occ-cell">
                          <span className={isCrit ? 'text-error font-bold' : isShuttleBoosted ? 'text-cyan font-bold' : ''}>
                            {occ.toLocaleString()} / {cap.toLocaleString()} ({pct}%)
                          </span>
                          {isShuttleBoosted && (
                            <span className="occ-cleared-tag font-mono">
                              ↓ Capacity Expanded to {cap.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="zone-bar-cell">
                          <div className="transit-pressure-track">
                            <div
                              className="transit-pressure-fill"
                              style={{
                                width: `${Math.min(100, transitPress)}%`,
                                background: isCrit ? '#ef4444' : isElev ? '#eab308' : '#10b981',
                              }}
                            />
                          </div>
                          <span className="transit-press-val">{transitPress}%</span>
                        </td>
                        <td className="zone-stress-cell">
                          <span className={isCrit ? 'text-error font-bold' : isElev ? 'text-warning' : 'text-normal'}>
                            {stress}
                          </span>
                        </td>
                        <td>
                          <span className={`matrix-status-pill ${isCrit ? 'pill-crit' : isElev ? 'pill-elev' : 'pill-norm'}`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-matrix-focus"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedZoneId(zid);
                            }}
                          >
                            FOCUS
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Row 4: What-If Dynamic Sandbox Bottom Dock */}
        <WhatIfDrawer
          whatIfOverrides={whatIfOverrides}
          onUpdateScenario={onUpdateScenario}
          onResetScenario={onResetScenario}
        />

        {/* Row 5: Operations Activity & Audit Log Report */}
        <div className="audit-log-panel glass-panel" id="audit-log-report">
          <div className="audit-log-header">
            <div className="audit-title-col">
              <div className="audit-badge-row">
                <ClipboardList size={18} className="text-secondary" />
                <h3 className="audit-panel-title">Operations Activity & Audit Log Report</h3>
                <span className="live-audit-pill font-mono">
                  <span className="pulse-dot-cyan-sm"></span>
                  LIVE AUDIT TRAIL
                </span>
              </div>
              <p className="audit-subtitle">
                Chronological record of operator interventions, crowd rerouting, shuttle boosts, schedule shifts, and advisories.
              </p>
            </div>

            <div className="audit-tools font-mono">
              <span className="audit-count-badge">{filteredLogs.length} EVENTS RECORDED</span>
              <button
                className="btn-audit-tool"
                onClick={loadAuditLogs}
                disabled={loadingAuditLogs}
                title="Refresh Audit Log"
              >
                <RefreshCw size={13} className={loadingAuditLogs ? 'spin-anim' : ''} />
                <span>SYNC</span>
              </button>
              <button
                className="btn-audit-tool text-error-subtle"
                onClick={handleClearAuditLogs}
                title="Clear History"
              >
                <Trash2 size={13} />
                <span>CLEAR</span>
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="audit-filters-strip font-mono">
            {['ALL', 'SHUTTLES & REROUTES', 'SCHEDULE & TIMING', 'BROADCASTS & ADVISORIES', 'PLAYBOOKS & ALERTS'].map((f) => (
              <button
                key={f}
                className={`audit-filter-btn ${auditFilter === f ? 'active' : ''}`}
                onClick={() => setAuditFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Audit Logs Stream */}
          <div className="audit-entries-list">
            {filteredLogs.length === 0 ? (
              <div className="audit-empty font-mono">
                <CheckCircle size={20} className="text-success" />
                <span>No audit events recorded yet. Click any intervention, reroute, or simulation button above to log actions in real time.</span>
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const badgeInfo = getActionBadge(log.action);
                const timeStr = formatAuditTime(log.created_at);

                return (
                  <div key={log.id || index} className="audit-entry-row">
                    <div className="audit-time-col font-mono">
                      <span className="audit-clock">{timeStr}</span>
                      <span className="audit-user">{log.user_email || 'Raj (Organizer)'}</span>
                    </div>

                    <div className="audit-badge-col">
                      <span className={`audit-action-chip font-mono ${badgeInfo.colorClass}`}>
                        <span className="chip-icon">{badgeInfo.icon}</span>
                        <span>{badgeInfo.label}</span>
                      </span>
                    </div>

                    <div className="audit-desc-col">
                      <span className="audit-desc-text">
                        {log.details?.summary || log.details?.actionDescription || getFallbackSummary(log)}
                      </span>
                      {log.details?.details && typeof log.details.details === 'object' && (
                        <div className="audit-meta-tags font-mono">
                          {Object.entries(log.details.details).map(([k, v]) => (
                            <span key={k} className="audit-meta-tag">
                              {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Aerospace System Footer */}
      <footer className="app-aerospace-footer">
        <div>OMNIVENUE CORE ENGINE v4.8.2  •  AEROSPACE-GRADE TELEMETRY</div>
        <div>© 2025 CrowdPulse Logistics Network. Secured Feed.</div>
      </footer>

      <style>{`
        .organizer-view {
          min-height: calc(100vh - var(--nav-height));
          display: flex;
          flex-direction: column;
          background: transparent;
        }

        .command-sub-bar {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
          padding: 10px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
        }

        .meta-strip-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.68rem;
          color: #64748b;
          letter-spacing: 0.06em;
        }
        .live-dot-green {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .bold-white {
          color: #0f172a;
          font-weight: 700;
        }
        .sep {
          color: #cbd5e1;
        }

        .quick-interventions-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .interventions-label {
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin-right: 4px;
        }
        .btn-intervention {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .btn-intervention:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .btn-intervention.active {
          background: #e0f2fe;
          border-color: #bae6fd;
          color: #0284c7;
        }
        .strip-divider {
          width: 1px;
          height: 16px;
          background: #e2e8f0;
          margin: 0 4px;
        }

        .btn-intervention.highlight-broadcast {
          background: rgba(14, 165, 233, 0.08);
          border-color: rgba(14, 165, 233, 0.35);
          color: #0284c7;
        }
        .btn-intervention.highlight-broadcast:hover {
          background: rgba(14, 165, 233, 0.16);
        }

        /* Dynamic Shuttle Control Popover */
        .shuttle-control-wrapper {
          position: relative;
          display: inline-block;
        }
        .shuttle-popover {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          z-index: 100;
          width: 320px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
          padding: 16px;
          animation: popoverFadeIn 0.15s ease-out;
        }
        @keyframes popoverFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shuttle-popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .popover-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.05em;
        }
        .popover-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 4px;
        }
        .popover-close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .shuttle-popover-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 12px;
        }
        .popover-pct-display {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .pct-number {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0284c7;
          line-height: 1;
        }
        .pct-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.05em;
        }
        .popover-slider-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .clean-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e2e8f0;
          accent-color: #0284c7;
          outline: none;
          cursor: pointer;
        }
        .slider-range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.62rem;
          color: #94a3b8;
          font-weight: 600;
        }
        .popover-presets-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }
        .btn-preset-chip {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 5px 0;
          font-size: 0.68rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
        }
        .btn-preset-chip:hover {
          background: #f0f9ff;
          border-color: #bae6fd;
          color: #0284c7;
        }
        .btn-preset-chip.active {
          background: #e0f2fe;
          border-color: #0284c7;
          color: #0284c7;
          box-shadow: 0 0 0 1px #0284c7;
        }
        .popover-impact-preview {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .impact-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.65rem;
        }
        .impact-k {
          color: #64748b;
          font-weight: 600;
        }
        .impact-v {
          font-weight: 700;
        }
        .popover-actions-row {
          display: flex;
          margin-top: 2px;
        }
        .btn-popover-apply {
          width: 100%;
          background: linear-gradient(135deg, #0284c7, #0369a1);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.25);
        }
        .btn-popover-apply:hover {
          background: linear-gradient(135deg, #0369a1, #075985);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
        }

        /* Broadcast Toast Feedback */
        .broadcast-toast-strip {
          background: #ecfdf5;
          border-bottom: 1px solid #a7f3d0;
          color: #065f46;
          padding: 8px 24px;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: fadeIn 0.2s ease;
        }

        /* Modal Overlay & Card */
        .modal-backdrop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .broadcast-modal-card {
          max-width: 540px;
          width: 100%;
          background: #ffffff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-header .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .modal-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .btn-modal-close {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
        }
        .broadcast-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.05em;
        }
        .clean-input, .clean-select, .clean-textarea {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.84rem;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
        }
        .clean-input:focus, .clean-select:focus, .clean-textarea:focus {
          border-color: #0284c7;
          background: #ffffff;
        }
        .modal-actions-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 8px;
        }
        .btn-modal-cancel {
          padding: 8px 14px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.76rem;
        }
        .btn-modal-submit {
          padding: 8px 16px;
          background: #0284c7;
          border: none;
          color: #ffffff;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.76rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-modal-submit:hover {
          background: #0369a1;
        }

        /* Telemetry Inspector Drawer */
        .telemetry-inspector-drawer {
          margin: 12px 24px 0 24px;
          padding: 16px 20px;
          background: #ffffff;
          border: 1px solid #bae6fd;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .inspector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .inspector-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .inspector-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }
        .telemetry-pill {
          font-size: 0.64rem;
          background: #e0f2fe;
          color: #0284c7;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 700;
        }
        .btn-inspector-close {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
        }
        .inspector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .inspector-stat-box {
          padding: 12px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-label {
          font-size: 0.64rem;
          color: #64748b;
          font-weight: 700;
        }
        .stat-val {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
        }
        .stat-sub {
          font-size: 0.7rem;
          color: #64748b;
        }
        .inspector-notes-row {
          font-size: 0.76rem;
          color: #334155;
          display: flex;
          gap: 8px;
          align-items: center;
          background: #fffbeb;
          border: 1px solid #fde68a;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .dashboard-content-body {
          max-width: 1760px;
          width: 100%;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }

        .intelligence-split-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 16px;
          min-height: 580px;
        }
        @media (max-width: 1180px) {
          .intelligence-split-grid {
            grid-template-columns: 1fr;
          }
        }

        .map-block {
          height: 100%;
          min-height: 580px;
        }
        .feeds-block {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }

        /* Perimeter Telemetry Matrix */
        .perimeter-matrix-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-shadow: 0 2px 12px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .perimeter-matrix-card:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
          border-color: rgba(99, 102, 241, 0.25);
        }
        .matrix-header {
          padding: 14px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .matrix-title-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .matrix-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }
        .active-sectors-pill {
          font-size: 0.65rem;
          color: #64748b;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .polling-rate {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          color: #64748b;
        }
        .pulse-dot-cyan-sm {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0284c7;
          box-shadow: 0 0 6px rgba(2, 132, 199, 0.4);
        }

        .matrix-table-wrap {
          overflow-x: auto;
        }
        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.76rem;
        }
        .matrix-table th {
          background: #f8fafc;
          color: #64748b;
          padding: 10px 18px;
          font-weight: 700;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e2e8f0;
        }
        .matrix-table td {
          padding: 11px 18px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
        }
        .matrix-table tr:hover {
          background: #f8fafc;
          cursor: pointer;
        }
        .matrix-table tr.selected-row {
          background: #ede9fe;
        }

        .zone-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
        }
        .zone-bold-name {
          font-weight: 600;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .dot-red { background: #e11d48; }
        .dot-amber { background: #b45309; }
        .dot-green { background: #059669; }

        .zone-bar-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .transit-pressure-track {
          width: 90px;
          height: 5px;
          border-radius: 3px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .transit-pressure-fill {
          height: 100%;
          border-radius: 3px;
        }
        .transit-press-val {
          font-size: 0.72rem;
          color: #64748b;
          min-width: 32px;
        }

        .matrix-status-pill {
          font-size: 0.62rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }
        .pill-crit {
          background: #fff1f2;
          color: #e11d48;
          border: 1px solid #fecdd3;
        }
        .pill-elev {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .pill-norm {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .btn-matrix-focus {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          padding: 3px 9px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .btn-matrix-focus:hover {
          background: #6366f1;
          border-color: #6366f1;
          color: #ffffff;
        }

        .shuttle-active-pill {
          margin-left: 8px;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          color: #0284c7;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
        }
        .occ-cleared-tag {
          display: block;
          font-size: 0.62rem;
          font-weight: 700;
          color: #059669;
          margin-top: 2px;
        }

        .text-error { color: #e11d48; }
        .text-warning { color: #b45309; }
        .text-normal { color: #059669; }
        .text-secondary { color: #0284c7; }

        /* Operations Activity & Audit Log Report */
        .audit-log-panel {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          box-shadow: 0 2px 12px rgba(100, 116, 139, 0.06);
          margin-top: 4px;
          margin-bottom: 24px;
          transition: all 0.2s ease;
        }
        .audit-log-panel:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
          border-color: rgba(99, 102, 241, 0.25);
        }
        .audit-log-header {
          padding: 16px 22px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .audit-title-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .audit-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .audit-panel-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .live-audit-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          color: #0284c7;
          font-size: 0.64rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .audit-subtitle {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0;
        }
        .audit-tools {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .audit-count-badge {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 5px;
        }
        .btn-audit-tool {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #334155;
          padding: 4px 10px;
          border-radius: 5px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-audit-tool:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .text-error-subtle:hover {
          background: #fff1f2 !important;
          border-color: #fecdd3 !important;
          color: #e11d48 !important;
        }

        .audit-filters-strip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 22px;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
          overflow-x: auto;
        }
        .audit-filter-btn {
          background: transparent;
          border: 1px solid transparent;
          color: #64748b;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .audit-filter-btn:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .audit-filter-btn.active {
          background: #eef2ff;
          border-color: #c7d2fe;
          color: #4f46e5;
        }

        .audit-entries-list {
          display: flex;
          flex-direction: column;
          max-height: 380px;
          overflow-y: auto;
          background: #ffffff;
        }
        .audit-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 20px;
          color: #64748b;
          font-size: 0.8rem;
        }
        .audit-entry-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 22px;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s;
        }
        .audit-entry-row:hover {
          background: #f8fafc;
        }
        .audit-time-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 140px;
        }
        .audit-clock {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0f172a;
        }
        .audit-user {
          font-size: 0.65rem;
          color: #94a3b8;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .audit-badge-col {
          min-width: 155px;
        }
        .audit-action-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.64rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }
        .chip-cyan {
          background: #f0f9ff;
          color: #0284c7;
          border: 1px solid #bae6fd;
        }
        .chip-emerald {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }
        .chip-purple {
          background: #faf5ff;
          color: #7c3aed;
          border: 1px solid #e9d5ff;
        }
        .chip-amber {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .chip-indigo {
          background: #eef2ff;
          color: #4f46e5;
          border: 1px solid #c7d2fe;
        }
        .chip-green {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .chip-slate {
          background: #f8fafc;
          color: #475569;
          border: 1px solid #cbd5e1;
        }
        .chip-blue {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .audit-desc-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .audit-desc-text {
          font-size: 0.8rem;
          color: #1e293b;
          font-weight: 500;
        }
        .audit-meta-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .audit-meta-tag {
          font-size: 0.62rem;
          background: #f1f5f9;
          color: #64748b;
          padding: 1px 6px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
