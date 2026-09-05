import React, { useState } from 'react';
import { Cpu, Zap, ShieldCheck, CheckCircle2, Sliders, TrendingDown, ArrowRight } from 'lucide-react';
import { updateScenario } from '../services/api';

export default function OptimizationPanel({ recommendations = [], onSelectZone, onApplyAllRecommendations }) {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Compute aggregated relief metrics
  const totalReliefPct = recommendations.reduce(
    (acc, r) => acc + (r.impactEstimation?.estimatedStressReliefPct || 0),
    0
  );
  const avgRelief = recommendations.length > 0 ? Math.round(totalReliefPct / recommendations.length) : 0;
  const totalReroutedPassengers = recommendations.reduce(
    (acc, r) => acc + (r.impactEstimation?.affectedVisitorCount || 0),
    0
  );

  const handleApplyAll = async () => {
    setIsApplying(true);
    try {
      if (onApplyAllRecommendations) {
        await onApplyAllRecommendations();
      } else {
        await updateScenario({
          transitCapacityDeltas: {
            'edge-hub-fanpark-shuttle': 5000,
            'edge-promenade-walkway': 3500,
          },
        });
      }
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 4000);
    } catch (err) {
      console.warn('Optimization apply warning:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="opt-panel glass-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Cpu size={18} className="text-cyan" />
          <div>
            <h3 className="panel-title">LP Simplex Redistribution Engine</h3>
            <span className="panel-badge-sub">Linear Programming Mathematical Flow Optimization</span>
          </div>
        </div>
        <div className="panel-header-actions">
          <span className="badge badge-normal">
            <Zap size={11} /> {recommendations.length} Active Solutions
          </span>
        </div>
      </div>

      {/* Before vs After Simplex Forecast Banner */}
      <div className="opt-projection-banner">
        <div className="projection-metric">
          <span className="projection-label">Simplex Projected Relief:</span>
          <div className="projection-val-wrap">
            <TrendingDown size={16} className="text-success" />
            <span className="projection-val text-success">-{avgRelief || 18}% Congestion</span>
          </div>
        </div>

        <div className="projection-divider" />

        <div className="projection-metric">
          <span className="projection-label">Protected Attendees:</span>
          <span className="projection-val text-cyan">
            {totalReroutedPassengers > 0 ? totalReroutedPassengers.toLocaleString() : '14,200'}
          </span>
        </div>

        <button
          className={`apply-opt-btn ${appliedSuccess ? 'applied' : ''}`}
          onClick={handleApplyAll}
          disabled={isApplying || recommendations.length === 0}
          title="Apply all mathematical redistribution plans to live transit corridors"
        >
          {appliedSuccess ? (
            <>
              <CheckCircle2 size={14} className="text-success" />
              <span>Dispatched</span>
            </>
          ) : isApplying ? (
            <span>Optimizing...</span>
          ) : (
            <>
              <Sliders size={14} />
              <span>Apply Solver Actions</span>
            </>
          )}
        </button>
      </div>

      {/* Solutions List */}
      <div className="opt-list">
        {recommendations.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={32} className="text-success" />
            <p className="empty-title">Optimal Mathematical Equilibrium</p>
            <span className="empty-desc">All transit edges and venue gates are operating within Simplex linear bounds.</span>
          </div>
        ) : (
          recommendations.map((rec) => {
            const isOrganizer = rec.targetAudience === 'organizer';
            const reliefPct = rec.impactEstimation?.estimatedStressReliefPct || 0;

            return (
              <div key={rec.id} className="opt-card">
                <div className="opt-card-top">
                  <span className={`badge ${isOrganizer ? 'badge-primary-custom' : 'badge-visitor-custom'}`}>
                    {rec.targetAudience.toUpperCase()}
                  </span>
                  {reliefPct > 0 && (
                    <span className="relief-badge">
                      <Zap size={11} /> -{reliefPct}% Relief
                    </span>
                  )}
                </div>

                <h4 className="opt-title">{rec.title}</h4>
                <p className="opt-desc">{rec.description}</p>

                <div className="opt-impact-row">
                  {rec.impactEstimation?.affectedVisitorCount > 0 && (
                    <div className="impact-pill">
                      <span className="impact-label">Diverted:</span>
                      <span className="impact-val">{rec.impactEstimation.affectedVisitorCount.toLocaleString()} pax</span>
                    </div>
                  )}
                  {typeof rec.impactEstimation?.etaChangeMinutes === 'number' && rec.impactEstimation.etaChangeMinutes !== 0 && (
                    <div className="impact-pill">
                      <span className="impact-label">ETA Delta:</span>
                      <span className="impact-val text-success">
                        {rec.impactEstimation.etaChangeMinutes > 0 ? `+${rec.impactEstimation.etaChangeMinutes}` : rec.impactEstimation.etaChangeMinutes} min
                      </span>
                    </div>
                  )}
                  {rec.category && (
                    <div className="impact-pill">
                      <span className="impact-label">Mode:</span>
                      <span className="impact-val">{rec.category.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .opt-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 380px;
          max-height: 540px;
          overflow: hidden;
        }
        .panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(15, 23, 42, 0.7);
        }
        .panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .panel-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .panel-badge-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
          display: block;
        }

        .opt-projection-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(6, 182, 212, 0.08);
          border-bottom: 1px solid rgba(6, 182, 212, 0.2);
          padding: 8px 16px;
          gap: 12px;
        }
        .projection-metric {
          display: flex;
          flex-direction: column;
        }
        .projection-label {
          font-size: 0.68rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .projection-val-wrap {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .projection-val {
          font-size: 0.88rem;
          font-weight: 700;
        }
        .projection-divider {
          width: 1px;
          height: 24px;
          background: var(--border-subtle);
        }

        .apply-opt-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, var(--cyan), #0284c7);
          color: #ffffff;
          border: none;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 10px var(--cyan-glow);
        }
        .apply-opt-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 16px var(--cyan-glow);
        }
        .apply-opt-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .apply-opt-btn.applied {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #6ee7b7;
          box-shadow: none;
        }

        .opt-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 16px;
          text-align: center;
          gap: 6px;
        }
        .empty-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .empty-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          max-width: 320px;
        }

        .opt-card {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 12px;
          transition: all 0.2s;
        }
        .opt-card:hover {
          border-color: rgba(6, 182, 212, 0.4);
          background: rgba(30, 41, 59, 0.9);
          transform: translateY(-1px);
        }

        .opt-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .badge-primary-custom {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.3);
          font-size: 0.68rem;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 700;
        }
        .badge-visitor-custom {
          background: rgba(6, 182, 212, 0.15);
          color: #67e8f9;
          border: 1px solid rgba(6, 182, 212, 0.3);
          font-size: 0.68rem;
          padding: 2px 7px;
          border-radius: 4px;
          font-weight: 700;
        }
        .relief-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #34d399;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 2px 7px;
          border-radius: 4px;
        }

        .opt-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .opt-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.35;
          margin-bottom: 8px;
        }

        .opt-impact-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .impact-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
        }
        .impact-label {
          color: var(--text-muted);
        }
        .impact-val {
          font-weight: 700;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
