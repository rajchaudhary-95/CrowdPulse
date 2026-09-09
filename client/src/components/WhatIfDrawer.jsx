import React, { useState } from 'react';
import { Sliders, Play, RotateCcw } from 'lucide-react';

export default function WhatIfDrawer({ whatIfOverrides = {}, onUpdateScenario, onResetScenario }) {
  const [demandSurge, setDemandSurge] = useState(whatIfOverrides.demandSurgeMultiplier || 1.35);
  const [eventOffset, setEventOffset] = useState(15);
  const [capacityOverride, setCapacityOverride] = useState('HIGH');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    if (onUpdateScenario) {
      await onUpdateScenario({
        demandSurgeMultiplier: parseFloat(demandSurge),
        eventStartTimeDeltas: {
          'evt-alegria-edm-night': parseInt(eventOffset, 10),
          'evt-alegria-flashmob': parseInt(eventOffset, 10),
        },
        transitCapacityDeltas: capacityOverride === 'HIGH'
          ? { 'edge-depot-maingate': 1.5, 'edge-sports-bypass': 1.6 }
          : capacityOverride === 'LOW'
          ? { 'edge-depot-maingate': 0.8 }
          : {},
        actionDescription: `Simulated Sandbox: ${demandSurge}x demand surge, +${eventOffset}m egress shift, ${capacityOverride} capacity`,
      });
    }
    setTimeout(() => setIsSimulating(false), 800);
  };

  return (
    <div className="whatif-dock glass-panel">
      <div className="whatif-brand-col">
        <div className="whatif-icon-box">
          <Sliders size={18} className="text-secondary" />
        </div>
        <div className="whatif-title-group">
          <h3 className="whatif-title">What-If Dynamic Sandbox</h3>
          <span className="whatif-subtitle font-mono">PREDICTIVE CROWD DYNAMICS</span>
        </div>
      </div>

      {/* Control 1: Demand Surge */}
      <div className="whatif-slider-col">
        <div className="slider-label-row font-mono">
          <span className="slider-name">DEMAND SURGE</span>
          <span className="slider-val text-cyan">{Number(demandSurge).toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="1.0"
          max="2.0"
          step="0.05"
          value={demandSurge}
          onChange={(e) => setDemandSurge(e.target.value)}
          className="dock-slider"
        />
        <div className="slider-bounds font-mono">
          <span>1.0x (Standard)</span>
          <span>2.0x (Crush)</span>
        </div>
      </div>

      {/* Control 2: Schedule Offset */}
      <div className="whatif-slider-col">
        <div className="slider-label-row font-mono">
          <span className="slider-name">SCHEDULE OFFSET</span>
          <span className="slider-val text-primary">+{eventOffset}m</span>
        </div>
        <input
          type="range"
          min="-30"
          max="60"
          step="5"
          value={eventOffset}
          onChange={(e) => setEventOffset(e.target.value)}
          className="dock-slider"
        />
        <div className="slider-bounds font-mono">
          <span>-30m (Early)</span>
          <span>+60m (Stagger)</span>
        </div>
      </div>

      {/* Control 3: Capacity Override */}
      <div className="whatif-toggle-col">
        <div className="slider-label-row font-mono">
          <span className="slider-name">CAPACITY OVERRIDE</span>
          <span className="slider-val text-secondary">{capacityOverride} FLOW</span>
        </div>
        <div className="segmented-pill font-mono">
          <button
            className={`pill-btn ${capacityOverride === 'STD' ? 'active' : ''}`}
            onClick={() => setCapacityOverride('STD')}
          >
            STD
          </button>
          <button
            className={`pill-btn ${capacityOverride === 'HIGH' ? 'active' : ''}`}
            onClick={() => setCapacityOverride('HIGH')}
          >
            HIGH
          </button>
          <button
            className={`pill-btn ${capacityOverride === 'CLEAR' ? 'active' : ''}`}
            onClick={() => setCapacityOverride('CLEAR')}
          >
            CLEAR
          </button>
        </div>
        <span className="toggle-caption font-mono">Turnstiles + Auxiliary Gates</span>
      </div>

      {/* Action CTA Button */}
      <div className="whatif-cta-col">
        <button
          className="btn-simulate-dispersion font-mono"
          onClick={handleSimulate}
          disabled={isSimulating}
        >
          <Play size={14} fill="currentColor" />
          <span>{isSimulating ? 'SIMULATING...' : 'SIMULATE DISPERSION'}</span>
        </button>
      </div>

      <style>{`
        .whatif-dock {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          padding: 16px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          box-shadow: 0 4px 20px rgba(100, 116, 139, 0.08);
          margin-top: 8px;
          transition: all 0.2s ease;
        }
        .whatif-dock:hover {
          border-color: rgba(99, 102, 241, 0.25);
          box-shadow: 0 6px 24px rgba(100, 116, 139, 0.12);
        }

        .whatif-brand-col {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 210px;
        }
        .whatif-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .whatif-title {
          font-family: var(--font-display);
          font-size: 0.98rem;
          font-weight: 700;
          color: #0f172a;
        }
        .whatif-subtitle {
          font-size: 0.62rem;
          color: #64748b;
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .whatif-slider-col {
          flex: 1;
          min-width: 170px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .slider-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          font-weight: 700;
        }
        .slider-name {
          color: #64748b;
        }
        .slider-val {
          font-weight: 800;
        }

        .dock-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 3px;
          background: #e2e8f0;
          outline: none;
        }
        .dock-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
          transition: transform 0.1s ease;
        }
        .dock-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .slider-bounds {
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          color: #94a3b8;
        }

        .whatif-toggle-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 160px;
        }
        .segmented-pill {
          display: flex;
          background: #f1f5f9;
          padding: 2px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .pill-btn {
          flex: 1;
          padding: 4px 8px;
          font-size: 0.68rem;
          font-weight: 700;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.15s;
        }
        .pill-btn.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
        }
        .toggle-caption {
          font-size: 0.6rem;
          color: #64748b;
        }

        .whatif-cta-col {
          display: flex;
          align-items: center;
        }
        .btn-simulate-dispersion {
          background: #0f172a;
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
        }
        .btn-simulate-dispersion:hover {
          background: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.22);
        }

        .text-cyan { color: #0284c7; }
        .text-primary { color: #6366f1; }
        .text-secondary { color: #0284c7; }
      `}</style>
    </div>
  );
}
