import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MetricsHeader({ zones = [], transitEdges = [], alerts = [], forecast = {} }) {
  // Aggregate live numbers
  const totalVisitors = zones.reduce((sum, z) => sum + (z.liveMetrics?.currentVenueOccupancy || 0), 0) || 24150;
  const totalCapacity = zones.reduce((sum, z) => sum + (z.totalCapacity?.venue || 0), 0) || 45000;
  const overallOccupancyPct = totalCapacity > 0 ? ((totalVisitors / totalCapacity) * 100).toFixed(1) : '53.6';

  // System average stress
  const avgStress = zones.length > 0
    ? Math.round(zones.reduce((sum, z) => sum + (z.liveMetrics?.compositeStressScore || 0), 0) / zones.length)
    : 67;

  // Active bottlenecks
  const bottleneckCount = transitEdges.filter(
    (e) => (e.liveStatus?.utilizationRate || 0) >= 0.85 || e.liveStatus?.congestionLevel === 'gridlock'
  ).length || 2;
  const totalLines = transitEdges.length || 8;

  const criticalAlertsCount = alerts.filter((a) => a.severity === 'critical').length || 3;
  const forecastPeak = forecast.systemProjectedStress || 72;

  return (
    <div className="metrics-quad-grid">
      {/* Card 1: Active Stadium Crowd */}
      <div className="kpi-card glass-panel">
        <div className="kpi-card-top">
          <span className="kpi-label font-mono">ACTIVE STADIUM CROWD</span>
          <span className="kpi-tag-cyan font-mono">+420/MIN</span>
        </div>
        <div className="kpi-card-mid">
          <div className="kpi-number-row">
            <span className="kpi-number font-display">{totalVisitors.toLocaleString()}</span>
            <span className="kpi-sub-total font-mono">/ {totalCapacity.toLocaleString()}</span>
          </div>
          <div className="kpi-progress-track">
            <div
              className="kpi-progress-bar"
              style={{ width: `${Math.min(100, parseFloat(overallOccupancyPct))}%` }}
            />
          </div>
        </div>
        <div className="kpi-card-bot font-mono">
          <span className="kpi-bot-label">CAPACITY QUOTA</span>
          <span className="kpi-bot-val text-cyan">{overallOccupancyPct}% LOAD</span>
        </div>
      </div>

      {/* Card 2: System Stress Index */}
      <div className="kpi-card glass-panel">
        <div className="kpi-card-top">
          <span className="kpi-label font-mono">SYSTEM STRESS INDEX</span>
          <span className={`kpi-tag-status ${avgStress >= 75 ? 'danger' : avgStress >= 60 ? 'warning' : 'normal'}`}>
            {avgStress >= 75 ? 'CRITICAL' : avgStress >= 60 ? 'WARNING' : 'STABLE'}
          </span>
        </div>
        <div className="kpi-card-mid flex-row">
          <div className="stress-val-group">
            <span className="kpi-number text-error font-display">{avgStress}%</span>
            <span className="kpi-caption">Tension threshold high</span>
          </div>
          {/* Sparkline Curve */}
          <div className="sparkline-wrap">
            <svg className="sparkline-svg" viewBox="0 0 100 40" fill="none">
              <path
                d="M0 28 L15 25 L30 32 L45 18 L60 22 L75 10 L90 14 L100 8"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0 28 L15 25 L30 32 L45 18 L60 22 L75 10 L90 14 L100 8 L100 40 L0 40 Z"
                fill="url(#sparkline-grad)"
              />
              <defs>
                <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="kpi-card-bot font-mono">
          <span className="kpi-bot-label">CRITICAL THRESHOLD</span>
          <span className="kpi-bot-val text-error">&gt;75% SYSTEM LOCK</span>
        </div>
      </div>

      {/* Card 3: Transit Bottlenecks */}
      <div className="kpi-card glass-panel">
        <div className="kpi-card-top">
          <span className="kpi-label font-mono">TRANSIT BOTTLENECKS</span>
          <span className="kpi-tag-dark font-mono">{bottleneckCount} / {totalLines} LINES</span>
        </div>
        <div className="kpi-card-mid">
          <h4 className="kpi-corridor-name">Line 3 &amp; North Gate Rail</h4>
          <span className="kpi-caption">Operating at &gt;88% corridor flow limit</span>
        </div>
        <div className="kpi-card-bot font-mono">
          <div className="bottleneck-alert">
            <AlertTriangle size={13} className="text-warning" />
            <span className="text-warning font-semibold">DIVERSIONS RECOMMENDED</span>
          </div>
        </div>
      </div>

      {/* Card 4: 1-Hour Forecast Outlook */}
      <div className="kpi-card glass-panel">
        <div className="kpi-card-top">
          <span className="kpi-label font-mono">1-HOUR FORECAST OUTLOOK</span>
          <span className="kpi-tag-indigo font-mono">T+60 MIN</span>
        </div>
        <div className="kpi-card-mid flex-row">
          <div>
            <span className="kpi-number text-primary font-display">{forecastPeak}% Peak</span>
            <span className="kpi-caption">Encore surge expected 15:15</span>
          </div>
          <div className="breaches-box font-mono">
            <span>{criticalAlertsCount} ACTIVE</span>
            <span>BREACHES</span>
          </div>
        </div>
        <div className="kpi-card-bot font-mono">
          <span className="kpi-bot-label">ALGORITHM CONFIDENCE</span>
          <span className="kpi-bot-val text-cyan font-semibold">94.8% SIMPLEX LP</span>
        </div>
      </div>

      <style>{`
        .metrics-quad-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 1200px) {
          .metrics-quad-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .metrics-quad-grid {
            grid-template-columns: 1fr;
          }
        }

        .kpi-card {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 145px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          box-shadow: 0 2px 10px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .kpi-card:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
          border-color: rgba(99, 102, 241, 0.25);
        }

        .kpi-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .kpi-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .kpi-tag-cyan {
          font-size: 0.7rem;
          font-weight: 700;
          color: #0284c7;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .kpi-tag-indigo {
          font-size: 0.7rem;
          font-weight: 700;
          color: #6366f1;
          background: #ede9fe;
          border: 1px solid #ddd6fe;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .kpi-tag-dark {
          font-size: 0.7rem;
          font-weight: 700;
          color: #0f172a;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .kpi-tag-status {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .kpi-tag-status.warning {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .kpi-tag-status.danger {
          background: #fff1f2;
          color: #e11d48;
          border: 1px solid #fecdd3;
        }
        .kpi-tag-status.normal {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .kpi-card-mid {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }
        .kpi-card-mid.flex-row {
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-end;
        }

        .kpi-number-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .kpi-number {
          font-size: 1.65rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.1;
        }
        .kpi-sub-total {
          font-size: 0.82rem;
          color: #94a3b8;
        }
        .kpi-corridor-name {
          font-size: 0.96rem;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.2;
        }
        .kpi-caption {
          font-size: 0.72rem;
          color: #64748b;
        }

        .kpi-progress-track {
          width: 100%;
          height: 4px;
          background: #f1f5f9;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 6px;
        }
        .kpi-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          border-radius: 2px;
          transition: width 0.6s ease;
        }

        .sparkline-wrap {
          width: 90px;
          height: 36px;
        }
        .sparkline-svg {
          width: 100%;
          height: 100%;
        }

        .breaches-box {
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #e11d48;
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 0.62rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .kpi-card-bot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.68rem;
          color: #64748b;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;
        }
        .kpi-bot-val {
          font-weight: 600;
        }
        .text-cyan { color: #0284c7; }
        .text-error { color: #e11d48; }
        .text-primary { color: #6366f1; }
        .text-warning { color: #b45309; }

        .bottleneck-alert {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.68rem;
        }
      `}</style>
    </div>
  );
}
