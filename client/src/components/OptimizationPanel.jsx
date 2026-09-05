import React from 'react';
import { Cpu, Zap, ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';

export default function OptimizationPanel({ recommendations = [], onSelectZone }) {
  return (
    <div className="opt-panel glass-panel">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Cpu size={18} className="text-cyan" />
          <div>
            <h3 className="panel-title">LP Redistribution Solver</h3>
            <span className="panel-badge-sub">Linear Programming &bull; In-House JS Simplex Engine</span>
          </div>
        </div>
        <span className="badge badge-normal">
          <Zap size={12} /> {recommendations.length} Actions
        </span>
      </div>

      <div className="opt-list">
        {recommendations.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={32} className="text-success" />
            <p>Optimal Flow Balance Maintained</p>
            <span>No fleet reallocation or turnstile throttling required.</span>
          </div>
        ) : (
          recommendations.map((rec) => {
            const isOrganizer = rec.targetAudience === 'organizer';
            const reliefPct = rec.impactEstimation?.estimatedStressReliefPct || 0;

            return (
              <div key={rec.id} className="opt-card">
                <div className="opt-card-top">
                  <span className={`badge ${isOrganizer ? 'badge-primary-custom' : 'badge-visitor-custom'}`}>
                    {rec.targetAudience.toUpperCase()} ACTION
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
                      <span className="impact-label">Passengers:</span>
                      <span className="impact-val">{rec.impactEstimation.affectedVisitorCount.toLocaleString()}</span>
                    </div>
                  )}
                  {typeof rec.impactEstimation?.etaChangeMinutes === 'number' && rec.impactEstimation.etaChangeMinutes !== 0 && (
                    <div className="impact-pill">
                      <span className="impact-label">ETA Delta:</span>
                      <span className="impact-val">
                        {rec.impactEstimation.etaChangeMinutes > 0 ? `+${rec.impactEstimation.etaChangeMinutes}` : rec.impactEstimation.etaChangeMinutes} min
                      </span>
                    </div>
                  )}
                  {rec.category && (
                    <div className="impact-pill">
                      <span className="impact-label">Category:</span>
                      <span className="impact-val">{rec.category.replace('_', ' ')}</span>
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
          max-height: 480px;
          overflow: hidden;
        }
        .panel-header {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(15, 23, 42, 0.5);
        }
        .panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .panel-title {
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .panel-badge-sub {
          font-size: 0.675rem;
          color: var(--text-muted);
        }
        .opt-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .opt-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .opt-card:hover {
          border-color: rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }
        .opt-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .badge-primary-custom {
          background: rgba(99, 102, 241, 0.15);
          color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .badge-visitor-custom {
          background: rgba(6, 182, 212, 0.15);
          color: #67e8f9;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }
        .relief-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--status-normal);
          background: var(--status-normal-bg);
          padding: 2px 8px;
          border-radius: 9999px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .opt-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .opt-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .opt-impact-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .impact-pill {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          padding: 3px 6px;
          font-size: 0.675rem;
          display: flex;
          gap: 4px;
        }
        .impact-label {
          color: var(--text-muted);
        }
        .impact-val {
          color: var(--text-primary);
          font-weight: 600;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
