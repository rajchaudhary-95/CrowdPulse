import React, { useState, useEffect } from 'react';
import MetricsHeader from '../components/MetricsHeader';
import MapView from '../components/MapView';
import AlertsFeed from '../components/AlertsFeed';
import OptimizationPanel from '../components/OptimizationPanel';
import WhatIfDrawer from '../components/WhatIfDrawer';
import {
  Maximize2,
  Minimize2,
  Table,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

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
  const [isZenMode, setIsZenMode] = useState(false);
  const [showTelemetryTable, setShowTelemetryTable] = useState(true);

  // Keyboard shortcut listener for Operations Ergonomics
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'f') {
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedZoneId(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickIntervention = async (type) => {
    if (type === 'boost_shuttles') {
      onUpdateScenario({
        transitCapacityDeltas: {
          'edge-hub-fanpark-shuttle': 6000,
          'edge-hub-arena-shuttle': 4000,
        },
      });
    } else if (type === 'offset_events') {
      onUpdateScenario({
        eventStartTimeDeltas: {
          'evt-concert-01': 30,
        },
      });
    } else if (type === 'reset_all') {
      onResetScenario();
    }
  };

  return (
    <div className={`dashboard-container ${isZenMode ? 'zen-mode' : ''}`}>
      {/* 1. Global Metrics Banner */}
      <div className="dashboard-top-bar">
        <div className="dashboard-title-group">
          <div className="command-badge">
            <Shield size={16} className="text-primary" />
            <span>OPERATIONAL COMMAND CENTER</span>
          </div>
          <p className="command-sub">
            Real-Time Perimeter Telemetry &bull; Simplex LP Flow Control &bull; Incident Triage
          </p>
        </div>

        <div className="dashboard-controls-group">
          {/* Quick Intervention Presets */}
          <div className="quick-action-pill-group">
            <button
              className="quick-action-btn"
              onClick={() => handleQuickIntervention('boost_shuttles')}
              title="Add +40% capacity to electric shuttle routes via LP optimization"
            >
              <span>🚌 +40% Shuttles</span>
            </button>
            <button
              className="quick-action-btn"
              onClick={() => handleQuickIntervention('offset_events')}
              title="Offset concert start time by 30 mins to stagger egress peaks"
            >
              <span>⏱️ Stagger Egress (+30m)</span>
            </button>
            <button
              className="quick-action-btn reset-btn"
              onClick={() => handleQuickIntervention('reset_all')}
              title="Reset all scenario overrides"
            >
              <span>↺ Reset Levers</span>
            </button>
          </div>

          {/* Table Toggle & Zen / Fullscreen Toggle */}
          <button
            className={`btn-utility ${showTelemetryTable ? 'active' : ''}`}
            onClick={() => setShowTelemetryTable(!showTelemetryTable)}
            title="Toggle Live Zone Telemetry Table"
          >
            <Table size={15} />
            <span>Zone Table</span>
          </button>

          <button
            className="btn-utility"
            onClick={() => setIsZenMode(!isZenMode)}
            title="Toggle Command Center Fullscreen / Zen View (Press 'F')"
          >
            {isZenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isZenMode ? 'Exit Zen' : 'Zen Mode'}</span>
          </button>
        </div>
      </div>

      <MetricsHeader
        zones={zones}
        transitEdges={transitEdges}
        alerts={alerts}
        forecast={forecast}
      />

      {/* 2. Optional High-Density Zone Telemetry Table */}
      {showTelemetryTable && (
        <div className="telemetry-table-panel glass-panel">
          <div className="table-header">
            <div className="table-title">
              <Layers size={15} className="text-cyan" />
              <span>Zone Perimeter Telemetry & Pressure Matrix</span>
            </div>
            <span className="table-count">{zones.length} Zones Online</span>
          </div>

          <div className="table-scroll-wrap">
            <table className="telemetry-table">
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Category</th>
                  <th>Occupancy</th>
                  <th>Capacity Limit</th>
                  <th>Transit Pressure</th>
                  <th>Stress Score</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => {
                  const zid = zone._id || zone.id;
                  const occ = zone.liveMetrics?.currentVenueOccupancy || 0;
                  const cap = zone.totalCapacity?.venue || 1;
                  const occPct = Math.round((occ / cap) * 100);
                  const transitPress = Math.round((zone.liveMetrics?.currentTransitPressure || 0) * 100);
                  const stress = zone.liveMetrics?.compositeStressScore || 0;
                  const isSelected = selectedZoneId === zid;

                  return (
                    <tr
                      key={zid}
                      className={`${isSelected ? 'selected-row' : ''}`}
                      onClick={() => setSelectedZoneId(zid)}
                    >
                      <td className="zone-cell-name">
                        <strong>{zone.name}</strong>
                      </td>
                      <td className="zone-cell-cat">{zone.category?.replace(/_/g, ' ')}</td>
                      <td className="zone-cell-val font-num">
                        {occ.toLocaleString()} <span className="cell-pct">({occPct}%)</span>
                      </td>
                      <td className="zone-cell-val font-num">{cap.toLocaleString()}</td>
                      <td className="zone-cell-val font-num">
                        <div className="cell-bar-wrap">
                          <div
                            className="cell-bar"
                            style={{
                              width: `${Math.min(100, transitPress)}%`,
                              background: transitPress > 75 ? '#f97316' : '#06b6d4',
                            }}
                          />
                          <span>{transitPress}%</span>
                        </div>
                      </td>
                      <td className="zone-cell-val font-num">
                        <span
                          className="stress-pill"
                          style={{
                            color: stress > 85 ? '#ef4444' : stress > 65 ? '#f59e0b' : '#10b981',
                          }}
                        >
                          {stress}/100
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${zone.liveMetrics?.status || 'normal'}`}>
                          {zone.liveMetrics?.status?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-focus-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedZoneId(zid);
                          }}
                        >
                          Focus
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

      {/* 3. Main Geospatial & Intelligence Grid */}
      <div className="main-intel-grid">
        {/* Left Column: Interactive Leaflet Map */}
        <div className="map-column">
          <MapView
            zones={zones}
            transitEdges={transitEdges}
            venues={venues}
            forecast={forecast}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
          />
        </div>

        {/* Right Column: Live Breach Alerts & LP Optimization Solver */}
        <div className="intelligence-column">
          <div className="intel-panel-item">
            <OptimizationPanel
              recommendations={recommendations}
              onSelectZone={setSelectedZoneId}
              onApplyAllRecommendations={() => handleQuickIntervention('boost_shuttles')}
            />
          </div>
          <div className="intel-panel-item">
            <AlertsFeed
              alerts={alerts}
              onSelectZone={setSelectedZoneId}
            />
          </div>
        </div>
      </div>

      {/* 4. Bottom What-If Interactive Slider Drawer */}
      <WhatIfDrawer
        whatIfOverrides={whatIfOverrides}
        onUpdateScenario={onUpdateScenario}
        onResetScenario={onResetScenario}
      />

      <style>{`
        .dashboard-container {
          padding: 16px 24px;
          max-width: 1720px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.3s ease;
        }

        .dashboard-container.zen-mode {
          max-width: 100%;
          padding: 8px 16px;
        }

        .dashboard-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .command-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #a5b4fc;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
        }
        .command-sub {
          font-size: 0.76rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .dashboard-controls-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .quick-action-pill-group {
          display: flex;
          gap: 6px;
          background: rgba(0, 0, 0, 0.3);
          padding: 3px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }
        .quick-action-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .quick-action-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }
        .reset-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .btn-utility {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-utility:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }
        .btn-utility.active {
          background: rgba(6, 182, 212, 0.15);
          border-color: var(--cyan);
          color: var(--cyan);
        }

        /* Telemetry Table */
        .telemetry-table-panel {
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .table-header {
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.8);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .table-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .table-count {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .table-scroll-wrap {
          overflow-x: auto;
        }
        .telemetry-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.78rem;
          text-align: left;
        }
        .telemetry-table th {
          background: rgba(0, 0, 0, 0.25);
          color: var(--text-muted);
          padding: 8px 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid var(--border-subtle);
        }
        .telemetry-table td {
          padding: 8px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
        }
        .telemetry-table tr:hover {
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
        }
        .telemetry-table tr.selected-row {
          background: rgba(99, 102, 241, 0.12);
        }
        .zone-cell-name {
          color: var(--text-primary);
        }
        .cell-pct {
          color: var(--text-muted);
          font-size: 0.72rem;
        }
        .cell-bar-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cell-bar {
          height: 6px;
          border-radius: 3px;
          min-width: 4px;
          max-width: 70px;
        }
        .stress-pill {
          font-weight: 700;
        }
        .status-pill {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .status-pill.normal { background: rgba(16, 185, 129, 0.15); color: #34d399; }
        .status-pill.elevated { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
        .status-pill.warning { background: rgba(249, 115, 22, 0.15); color: #fb923c; }
        .status-pill.critical { background: rgba(239, 68, 68, 0.15); color: #f87171; }

        .table-focus-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .table-focus-btn:hover {
          background: var(--primary);
        }

        /* Main Intel Grid */
        .main-intel-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 14px;
          min-height: 560px;
        }
        @media (max-width: 1120px) {
          .main-intel-grid {
            grid-template-columns: 1fr;
          }
        }
        .map-column {
          min-height: 520px;
          height: 100%;
        }
        .intelligence-column {
          display: flex;
          flex-direction: column;
          gap: 14px;
          height: 100%;
        }
        .intel-panel-item {
          flex: 1;
          min-height: 270px;
        }
      `}</style>
    </div>
  );
}
