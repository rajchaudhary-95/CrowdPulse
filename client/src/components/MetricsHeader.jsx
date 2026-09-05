import React from 'react';
import { Users, AlertTriangle, Activity, Bus, TrendingUp } from 'lucide-react';

export default function MetricsHeader({ zones = [], transitEdges = [], alerts = [], forecast = {} }) {
  // Aggregate total active visitors
  const totalVisitors = zones.reduce((sum, z) => sum + (z.liveMetrics?.currentVenueOccupancy || 0), 0);
  const totalCapacity = zones.reduce((sum, z) => sum + (z.totalCapacity?.venue || 0), 0);
  const overallOccupancyPct = totalCapacity > 0 ? Math.round((totalVisitors / totalCapacity) * 100) : 0;

  // System average stress
  const avgStress = zones.length > 0
    ? Math.round(zones.reduce((sum, z) => sum + (z.liveMetrics?.compositeStressScore || 0), 0) / zones.length)
    : 0;

  // Critical/Warning zones count
  const criticalCount = zones.filter((z) => (z.liveMetrics?.compositeStressScore || 0) >= 88).length;
  const elevatedCount = zones.filter((z) => {
    const s = z.liveMetrics?.compositeStressScore || 0;
    return s >= 60 && s < 88;
  }).length;

  // Active bottlenecks
  const bottleneckCount = transitEdges.filter(
    (e) => (e.liveStatus?.utilizationRate || 0) >= 0.85 || e.liveStatus?.congestionLevel === 'gridlock'
  ).length;

  return (
    <div className="metrics-grid">
      <div className="metric-card glass-panel">
        <div className="metric-icon-wrap primary">
          <Users size={20} />
        </div>
        <div className="metric-content">
          <span className="metric-label">Active Stadium Crowd</span>
          <div className="metric-val-row">
            <span className="metric-number">{totalVisitors.toLocaleString()}</span>
            <span className="metric-sub">/ {totalCapacity.toLocaleString()}</span>
          </div>
          <div className="metric-progress-track">
            <div className="metric-progress-bar" style={{ width: `${Math.min(100, overallOccupancyPct)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="metric-card glass-panel">
        <div className={`metric-icon-wrap ${avgStress >= 75 ? 'danger' : avgStress >= 60 ? 'warning' : 'success'}`}>
          <Activity size={20} />
        </div>
        <div className="metric-content">
          <span className="metric-label">System Stress Index</span>
          <div className="metric-val-row">
            <span className="metric-number">{avgStress}%</span>
            <span className={`badge badge-${avgStress >= 88 ? 'critical' : avgStress >= 75 ? 'warning' : avgStress >= 60 ? 'elevated' : 'normal'}`}>
              {avgStress >= 88 ? 'CRITICAL' : avgStress >= 75 ? 'WARNING' : avgStress >= 60 ? 'ELEVATED' : 'STABLE'}
            </span>
          </div>
          <span className="metric-caption">
            {criticalCount} Critical &bull; {elevatedCount} Elevated Zones
          </span>
        </div>
      </div>

      <div className="metric-card glass-panel">
        <div className="metric-icon-wrap warning">
          <Bus size={20} />
        </div>
        <div className="metric-content">
          <span className="metric-label">Transit Bottlenecks</span>
          <div className="metric-val-row">
            <span className="metric-number">{bottleneckCount}</span>
            <span className="metric-sub">of {transitEdges.length} lines</span>
          </div>
          <span className="metric-caption">
            {bottleneckCount > 0 ? 'Peak demand corridor diversion active' : 'All lines flowing normally'}
          </span>
        </div>
      </div>

      <div className="metric-card glass-panel">
        <div className="metric-icon-wrap cyan">
          <TrendingUp size={20} />
        </div>
        <div className="metric-content">
          <span className="metric-label">1-Hour Forecast Outlook</span>
          <div className="metric-val-row">
            <span className="metric-number">{forecast.systemProjectedStress || avgStress}%</span>
            <span className="metric-sub">proj. stress</span>
          </div>
          <span className="metric-caption">
            {alerts.length} proactive alerts active
          </span>
        </div>
      </div>

      <style>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }
        .metric-card {
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .metric-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .metric-icon-wrap.primary {
          background: rgba(99, 102, 241, 0.15);
          color: var(--primary);
          border: 1px solid var(--border-active);
        }
        .metric-icon-wrap.success {
          background: var(--status-normal-bg);
          color: var(--status-normal);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .metric-icon-wrap.warning {
          background: var(--status-warning-bg);
          color: var(--status-warning);
          border: 1px solid rgba(249, 115, 22, 0.3);
        }
        .metric-icon-wrap.danger {
          background: var(--status-critical-bg);
          color: var(--status-critical);
          border: 1px solid rgba(239, 68, 68, 0.4);
        }
        .metric-icon-wrap.cyan {
          background: rgba(6, 182, 212, 0.15);
          color: var(--cyan);
          border: 1px solid var(--border-glow);
        }
        .metric-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .metric-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .metric-val-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .metric-number {
          font-family: 'Outfit', sans-serif;
          font-size: 1.45rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }
        .metric-sub {
          font-size: 0.775rem;
          color: var(--text-muted);
        }
        .metric-caption {
          font-size: 0.725rem;
          color: var(--text-secondary);
        }
        .metric-progress-track {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 4px;
        }
        .metric-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--cyan));
          border-radius: 4px;
          transition: width 0.4s ease;
        }
      `}</style>
    </div>
  );
}
