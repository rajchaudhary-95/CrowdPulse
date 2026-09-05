import React, { useState } from 'react';
import { Sliders, RotateCcw, Play, Clock, Users, Bus } from 'lucide-react';

export default function WhatIfDrawer({ whatIfOverrides = {}, onUpdateScenario, onResetScenario }) {
  const [demandSurge, setDemandSurge] = useState(whatIfOverrides.demandSurgeMultiplier || 1.0);
  const [eventOffset, setEventOffset] = useState(0); // Offset for main track finals
  const [shuttleMultiplier, setShuttleMultiplier] = useState(1.0);

  const handleApply = () => {
    onUpdateScenario({
      demandSurgeMultiplier: parseFloat(demandSurge),
      eventStartTimeDeltas: {
        'evt-gold-medal-finals': parseInt(eventOffset, 10),
      },
      transitCapacityDeltas: {
        'edge-shuttle-express': parseFloat(shuttleMultiplier),
      },
    });
  };

  const handleReset = () => {
    setDemandSurge(1.0);
    setEventOffset(0);
    setShuttleMultiplier(1.0);
    onResetScenario();
  };

  return (
    <div className="whatif-panel glass-panel">
      <div className="whatif-header">
        <div className="whatif-title-wrap">
          <Sliders size={18} className="text-cyan" />
          <h3 className="whatif-title">What-If Congestion Simulator</h3>
        </div>
        <button className="btn-secondary btn-sm" onClick={handleReset} title="Reset sliders to baseline">
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="whatif-controls-grid">
        {/* Slider 1: Global Demand Surge */}
        <div className="control-group">
          <div className="control-label-row">
            <span className="control-label">
              <Users size={14} className="control-icon" /> Demand Multiplier
            </span>
            <span className="control-val-badge">{Number(demandSurge).toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={demandSurge}
            onChange={(e) => {
              setDemandSurge(e.target.value);
              onUpdateScenario({ demandSurgeMultiplier: parseFloat(e.target.value) });
            }}
            className="slider-input"
          />
          <div className="slider-ticks">
            <span>0.5x (Light)</span>
            <span>1.0x (Baseline)</span>
            <span>2.5x (Emergency Surge)</span>
          </div>
        </div>

        {/* Slider 2: Event Start Time Offset */}
        <div className="control-group">
          <div className="control-label-row">
            <span className="control-label">
              <Clock size={14} className="control-icon" /> Track Finals Start Delta
            </span>
            <span className="control-val-badge">
              {eventOffset > 0 ? `+${eventOffset}` : eventOffset} min
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="60"
            step="10"
            value={eventOffset}
            onChange={(e) => {
              setEventOffset(e.target.value);
              onUpdateScenario({
                eventStartTimeDeltas: { 'evt-gold-medal-finals': parseInt(e.target.value, 10) },
              });
            }}
            className="slider-input"
          />
          <div className="slider-ticks">
            <span>-30m (Early)</span>
            <span>0m (Scheduled)</span>
            <span>+60m (Delayed)</span>
          </div>
        </div>

        {/* Slider 3: Shuttle Capacity Boost */}
        <div className="control-group">
          <div className="control-label-row">
            <span className="control-label">
              <Bus size={14} className="control-icon" /> Electric Shuttle Fleet
            </span>
            <span className="control-val-badge">{Number(shuttleMultiplier).toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={shuttleMultiplier}
            onChange={(e) => {
              setShuttleMultiplier(e.target.value);
              onUpdateScenario({
                transitCapacityDeltas: { 'edge-shuttle-express': parseFloat(e.target.value) },
              });
            }}
            className="slider-input"
          />
          <div className="slider-ticks">
            <span>0.5x (Fleet Down)</span>
            <span>1.0x (Standard)</span>
            <span>2.0x (Max Fleet)</span>
          </div>
        </div>
      </div>

      <div className="whatif-footer">
        <span className="whatif-hint">
          &bull; Drag sliders to simulate demand shocks. The Linear Programming solver instantly reallocates shuttles and re-evaluates breach thresholds.
        </span>
      </div>

      <style>{`
        .whatif-panel {
          padding: 16px 20px;
          margin-top: 16px;
        }
        .whatif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .whatif-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .whatif-title {
          font-size: 1rem;
          font-weight: 700;
        }
        .btn-sm {
          padding: 5px 10px;
          font-size: 0.75rem;
        }
        .whatif-controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .control-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .control-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .control-icon {
          color: var(--cyan);
        }
        .control-val-badge {
          font-family: monospace;
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--cyan);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          padding: 2px 8px;
          border-radius: 6px;
        }
        .slider-input {
          width: 100%;
          accent-color: var(--primary);
          cursor: pointer;
        }
        .slider-ticks {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .whatif-footer {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }
        .whatif-hint {
          font-size: 0.725rem;
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
