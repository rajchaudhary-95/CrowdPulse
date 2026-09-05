import React from 'react';
import { Activity, ShieldAlert, Navigation, RefreshCw, Clock } from 'lucide-react';

export default function Navbar({
  activeView,
  setActiveView,
  simulatedTime,
  isConnected,
  onReseed,
  isReseeding,
}) {
  const formattedTime = simulatedTime
    ? new Date(simulatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <div className="brand-badge">
          <div className="brand-logo">
            <Activity size={22} className="brand-icon" />
          </div>
          <div>
            <h1 className="brand-title">CrowdPulse <span className="brand-sub">/ OmniVenue</span></h1>
            <p className="brand-tagline">Mega-Event Orchestration & Visitor Guidance</p>
          </div>
        </div>
      </div>

      <div className="navbar-center">
        <div className="view-switcher">
          <button
            id="view-organizer-btn"
            className={`switcher-btn ${activeView === 'organizer' ? 'active' : ''}`}
            onClick={() => setActiveView('organizer')}
          >
            <ShieldAlert size={16} />
            Organizer Console
          </button>
          <button
            id="view-visitor-btn"
            className={`switcher-btn ${activeView === 'visitor' ? 'active' : ''}`}
            onClick={() => setActiveView('visitor')}
          >
            <Navigation size={16} />
            Visitor Companion
          </button>
        </div>
      </div>

      <div className="navbar-right">
        <div className="telemetry-pill">
          <Clock size={15} className="text-cyan" />
          <span className="telemetry-label">Simulated Time:</span>
          <span className="telemetry-value">{formattedTime}</span>
        </div>

        <div className="connection-pill">
          <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
          <span className="connection-text">{isConnected ? 'LIVE FEED' : 'CONNECTING...'}</span>
        </div>

        <button
          id="reseed-data-btn"
          className="btn-icon"
          title="Reset & Reseed Simulation Dataset"
          onClick={onReseed}
          disabled={isReseeding}
        >
          <RefreshCw size={15} className={isReseeding ? 'spin-anim' : ''} />
        </button>
      </div>

      <style>{`
        .navbar-container {
          height: var(--nav-height);
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .navbar-left {
          display: flex;
          align-items: center;
        }
        .brand-badge {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-logo {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, var(--primary), var(--cyan));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 0 16px var(--primary-glow);
        }
        .brand-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .brand-sub {
          font-weight: 400;
          color: var(--cyan);
          font-size: 0.95rem;
        }
        .brand-tagline {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .view-switcher {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 4px;
          display: flex;
          gap: 4px;
        }
        .switcher-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 7px 18px;
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .switcher-btn.active {
          background: linear-gradient(135deg, var(--primary), #4338ca);
          color: white;
          box-shadow: 0 2px 10px var(--primary-glow);
        }
        .switcher-btn:hover:not(.active) {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .telemetry-pill {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 5px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
        }
        .telemetry-label {
          color: var(--text-muted);
        }
        .telemetry-value {
          font-weight: 700;
          color: var(--text-primary);
          font-family: monospace;
          letter-spacing: 0.05em;
        }
        .text-cyan {
          color: var(--cyan);
        }
        .connection-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-full);
          padding: 5px 12px;
          font-size: 0.725rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .status-indicator.online {
          background: var(--status-normal);
          box-shadow: 0 0 8px var(--status-normal);
          animation: pulseGreen 2s infinite;
        }
        .status-indicator.offline {
          background: var(--status-critical);
          box-shadow: 0 0 8px var(--status-critical);
        }
        .connection-text {
          color: var(--status-normal);
        }
        .btn-icon {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
