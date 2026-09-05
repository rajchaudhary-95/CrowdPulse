import React from 'react';
import { Activity, ShieldAlert, Navigation, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileMenu from './UserProfileMenu';

export default function Navbar({
  activeView,
  setActiveView,
  simulatedTime,
  isConnected,
  onReseed,
  isReseeding,
}) {
  const { isOrganizer, promptLogin } = useAuth();

  const formattedTime = simulatedTime
    ? new Date(simulatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const handleOrganizerClick = () => {
    if (!isOrganizer) {
      promptLogin('organizer');
    } else {
      setActiveView('organizer');
    }
  };

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
            onClick={handleOrganizerClick}
            title={isOrganizer ? 'Organizer Command Center' : 'Requires Organizer Login'}
          >
            <ShieldAlert size={16} />
            Organizer Console
            {!isOrganizer && <span className="lock-tag">🔒</span>}
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
          <span className="telemetry-label">Simulated:</span>
          <span className="telemetry-value">{formattedTime}</span>
        </div>

        <div className="connection-pill">
          <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
          <span className="connection-text">{isConnected ? 'LIVE' : 'CONNECTING'}</span>
        </div>

        {isOrganizer && (
          <button
            id="reseed-data-btn"
            className="btn-icon"
            title="Reset & Reseed Simulation Dataset"
            onClick={onReseed}
            disabled={isReseeding}
          >
            <RefreshCw size={15} className={isReseeding ? 'spin-anim' : ''} />
          </button>
        )}

        <UserProfileMenu />
      </div>

      <style>{`
        .navbar-container {
          height: var(--nav-height);
          background: rgba(15, 23, 42, 0.9);
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
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px var(--primary-glow);
        }
        .brand-icon {
          color: #ffffff;
        }
        .brand-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .brand-sub {
          color: var(--cyan);
          font-weight: 400;
          font-size: 0.95rem;
        }
        .brand-tagline {
          font-size: 0.72rem;
          color: var(--text-muted);
          letter-spacing: 0.02em;
        }

        .navbar-center {
          display: flex;
          align-items: center;
        }
        .view-switcher {
          display: flex;
          background: rgba(0, 0, 0, 0.35);
          padding: 4px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }
        .switcher-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 18px;
          border-radius: var(--radius-full);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .switcher-btn:hover {
          color: var(--text-primary);
        }
        .switcher-btn.active {
          background: linear-gradient(135deg, var(--primary), #4338ca);
          color: #ffffff;
          box-shadow: 0 2px 10px var(--primary-glow);
        }
        .lock-tag {
          font-size: 0.7rem;
          margin-left: 2px;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .telemetry-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
        }
        .telemetry-label {
          color: var(--text-muted);
          display: none;
        }
        @media (min-width: 900px) {
          .telemetry-label { display: inline; }
        }
        .telemetry-value {
          font-weight: 700;
          color: var(--cyan);
          font-variant-numeric: tabular-nums;
        }

        .connection-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          padding: 5px 10px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .status-indicator {
          width: 7px;
          height: 7px;
          border-radius: var(--radius-full);
        }
        .status-indicator.online {
          background-color: var(--status-normal);
          box-shadow: 0 0 8px var(--status-normal);
        }
        .status-indicator.offline {
          background-color: var(--status-critical);
          box-shadow: 0 0 8px var(--status-critical);
        }
        .connection-text {
          color: var(--text-secondary);
        }

        .btn-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .btn-icon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
