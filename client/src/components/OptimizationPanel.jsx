import React, { useState } from 'react';
import { Zap, Clock, CheckCircle2, Sliders } from 'lucide-react';
import { updateScenario } from '../services/api';

export default function OptimizationPanel({ recommendations = [], onSelectZone, onApplyAllRecommendations }) {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      if (onApplyAllRecommendations) {
        await onApplyAllRecommendations();
      } else {
        await updateScenario({
          transitCapacityDeltas: {
            'edge-depot-maingate': 1.4,
            'edge-sports-bypass': 1.8,
          },
          actionDescription: 'Applied Simplex Linear Flow Diversion (-18% Concourse Congestion)',
        });
      }
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3500);
    } catch (err) {
      console.warn('Optimization apply error:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="optimizer-card glass-panel">
      {/* Header */}
      <div className="optimizer-header">
        <div className="optimizer-title-row">
          <Zap size={18} className="text-secondary" />
          <h3 className="optimizer-title">Simplex Flow Optimizer</h3>
        </div>
        <span className="solver-tag font-mono">SOLVER v4.2</span>
      </div>

      <p className="optimizer-subtitle">
        Autonomous linear optimization running against real-time pedestrian vector calculus.
      </p>

      {/* Solutions List */}
      <div className="solutions-list">
        <div className="solution-item">
          <div className="solution-icon-box">
            <Zap size={15} className="text-secondary" />
          </div>
          <div className="solution-text-group">
            <span className="solution-heading">-18% Concourse Congestion</span>
            <span className="solution-desc">Reroute 1,250 attendees from Gate North to South Promenade</span>
          </div>
        </div>

        <div className="solution-item">
          <div className="solution-icon-box">
            <Clock size={15} className="text-primary" />
          </div>
          <div className="solution-text-group">
            <span className="solution-heading">9.4 min Transit Wait Reduction</span>
            <span className="solution-desc">Inject 6 auxiliary electric bus units to Terminal B loops</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="optimizer-footer">
        <span className="projected-gain font-mono">PROJECTED GAIN: +24.8% EFF</span>
        <button
          className={`btn-apply-solver ${appliedSuccess ? 'applied' : ''}`}
          onClick={handleApply}
          disabled={isApplying}
        >
          {appliedSuccess ? (
            <>
              <CheckCircle2 size={15} />
              <span>ACTIONS DISPATCHED</span>
            </>
          ) : isApplying ? (
            <span>CALCULATING...</span>
          ) : (
            <>
              <Zap size={15} />
              <span>APPLY SOLVER ACTIONS</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        .optimizer-card {
          padding: 20px 22px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 12px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .optimizer-card:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
          border-color: rgba(99, 102, 241, 0.25);
        }

        .optimizer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .optimizer-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .optimizer-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }
        .solver-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #6366f1;
          background: #ede9fe;
          border: 1px solid #ddd6fe;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.04em;
        }

        .optimizer-subtitle {
          font-size: 0.76rem;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 14px;
        }

        .solutions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .solution-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          transition: all 0.15s ease;
        }
        .solution-item:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        .solution-icon-box {
          margin-top: 2px;
          display: flex;
          align-items: center;
        }
        .solution-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .solution-heading {
          font-size: 0.86rem;
          font-weight: 600;
          color: #0f172a;
        }
        .solution-desc {
          font-size: 0.74rem;
          color: #64748b;
          line-height: 1.35;
        }

        .optimizer-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
          flex-wrap: wrap;
          gap: 10px;
        }
        .projected-gain {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0284c7;
          letter-spacing: 0.04em;
        }
        .btn-apply-solver {
          background: #0f172a;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-family: var(--font-display);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
        }
        .btn-apply-solver:hover {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.22);
        }
        .btn-apply-solver.applied {
          background: #059669;
          color: #ffffff;
        }

        .text-secondary { color: #0284c7; }
        .text-primary { color: #6366f1; }
      `}</style>
    </div>
  );
}
