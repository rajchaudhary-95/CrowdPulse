import React from 'react';
import { Activity, Shield, Compass, RefreshCw, Clock, Lock, User } from 'lucide-react';
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
  const { isOrganizer, promptLogin, role } = useAuth();

  const formattedTime = simulatedTime
    ? new Date(simulatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC'
    : '14:35 UTC';

  const handleOrganizerClick = () => {
    if (!isOrganizer) {
      promptLogin('organizer');
    } else {
      setActiveView('organizer');
    }
  };

  return (
    <header className="navbar-container">
      {/* Left: Brand Identity */}
      <div className="navbar-left">
        <div className="brand-badge">
          <div className="brand-logo">
            <Activity size={20} className="brand-icon" />
          </div>
          <div className="brand-text-group">
            <h1 className="brand-title">
              CrowdPulse <span className="brand-sep">/</span> <span className="brand-sub">OmniVenue</span>
            </h1>
            <p className="brand-tagline">MEGA-EVENT ORCHESTRATION &amp; VISITOR GUIDANCE</p>
          </div>
        </div>
      </div>

      {/* Center: View Switcher */}
      <div className="navbar-center">
        <nav className="view-switcher-pill" aria-label="Main Navigation">
          <button
            id="view-organizer-btn"
            className={`switcher-tab ${activeView === 'organizer' ? 'active' : ''}`}
            onClick={handleOrganizerClick}
            title={isOrganizer ? 'Organizer Command Center' : 'Operational Clearance Required'}
          >
            <Shield size={14} />
            <span>Organizer Console</span>
            <Lock size={12} className="lock-icon" />
          </button>
          <button
            id="view-visitor-btn"
            className={`switcher-tab ${activeView === 'visitor' ? 'active' : ''}`}
            onClick={() => setActiveView('visitor')}
          >
            <Compass size={14} />
            <span>Visitor Companion</span>
          </button>
        </nav>
      </div>

      {/* Right: Live Telemetry & Profile */}
      <div className="navbar-right">
        <div className="telemetry-pill">
          <Clock size={14} className="telemetry-clock-icon" />
          <span className="telemetry-text font-mono">Simulated: {formattedTime}</span>
        </div>

        {/* Reseed only in Organizer view */}
        {activeView === 'organizer' && (
          <button
            id="reseed-data-btn"
            className="btn-sync"
            title="Reseed / Synchronize Data"
            onClick={onReseed}
            disabled={isReseeding}
            aria-label="Synchronize Data"
          >
            <RefreshCw size={14} className={isReseeding ? 'spin-anim' : ''} />
          </button>
        )}

        <div className="profile-badge-wrapper">
          <UserProfileMenu />
        </div>
      </div>

      <style>{`
        .navbar-container {
          height: var(--nav-height);
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
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
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #818cf8, #38bdf8);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.25);
        }
        .brand-icon {
          color: #ffffff;
        }
        .brand-text-group {
          display: flex;
          flex-direction: column;
        }
        .brand-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .brand-sep {
          color: #cbd5e1;
          font-weight: 400;
          margin: 0 2px;
        }
        .brand-sub {
          color: #64748b;
          font-weight: 600;
        }
        .brand-tagline {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.08em;
          margin-top: 1px;
        }

        .navbar-center {
          display: flex;
          align-items: center;
        }
        .view-switcher-pill {
          display: flex;
          background: #f1f5f9;
          padding: 3px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(203, 213, 225, 0.6);
        }
        .switcher-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid transparent;
          background: transparent;
          color: #64748b;
          font-family: var(--font-display);
          font-size: 0.76rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .switcher-tab:hover {
          color: #0f172a;
        }
        .switcher-tab.active {
          background: #ffffff;
          border-color: rgba(203, 213, 225, 0.8);
          color: #0f172a;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
          font-weight: 700;
        }
        .lock-icon {
          opacity: 0.6;
          margin-left: 2px;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .telemetry-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
        }
        .telemetry-clock-icon {
          color: #0284c7;
        }
        .telemetry-text {
          color: #0284c7;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .live-status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 5px 10px;
          border-radius: var(--radius-full);
        }
        .live-text {
          font-size: 0.7rem;
          font-weight: 700;
          color: #059669;
          letter-spacing: 0.05em;
        }

        .btn-sync {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .btn-sync:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .btn-sync:disabled {
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

        .profile-badge-wrapper {
          padding-left: 8px;
          border-left: 1px solid #e2e8f0;
        }
        .user-profile-button {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .profile-text-group {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.1;
        }
        .profile-id {
          font-size: 0.74rem;
          font-weight: 700;
          color: #0f172a;
        }
        .profile-role-tag {
          font-size: 0.6rem;
          font-weight: 700;
          color: #6366f1;
          background: #ede9fe;
          border: 1px solid #ddd6fe;
          padding: 1px 5px;
          border-radius: 4px;
          margin-top: 1px;
        }
        .profile-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, #818cf8, #6366f1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.25);
        }

        @media (max-width: 800px) {
          .hidden-sm { display: none; }
          .telemetry-pill { display: none; }
          .brand-tagline { display: none; }
        }
      `}</style>
    </header>
  );
}
