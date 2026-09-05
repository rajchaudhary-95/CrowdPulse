import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogIn, LogOut, ShieldCheck, UserCheck, ChevronDown } from 'lucide-react';

export default function UserProfileMenu() {
  const { user, role, logout, promptLogin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        id="auth-signin-btn"
        className="signin-nav-btn"
        onClick={() => promptLogin()}
        title="Sign in with your CrowdPulse account"
      >
        <LogIn size={15} />
        <span>Sign In / Register</span>
      </button>
    );
  }

  const initials = (user.fullName || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isOrganizer = role === 'organizer' || role === 'admin';

  return (
    <div className="user-profile-menu-container" ref={menuRef}>
      <button
        id="user-profile-btn"
        className={`user-trigger-btn ${isOrganizer ? 'organizer-glow' : 'visitor-glow'}`}
        onClick={() => setIsOpen(!isOpen)}
        title="View User Account & Role"
      >
        <div className={`user-avatar ${isOrganizer ? 'organizer' : 'visitor'}`}>
          {initials}
        </div>
        <div className="user-info-text">
          <span className="user-name">{user.fullName || user.email.split('@')[0]}</span>
          <span className={`user-role-badge ${isOrganizer ? 'role-organizer' : 'role-visitor'}`}>
            {isOrganizer ? 'ORGANIZER' : 'VISITOR'}
          </span>
        </div>
        <ChevronDown size={14} className={`dropdown-arrow ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="user-dropdown-panel glass-panel">
          <div className="dropdown-header">
            <div className="dropdown-user-details">
              <span className="dropdown-full-name">{user.fullName || 'Authorized User'}</span>
              <span className="dropdown-email">{user.email}</span>
            </div>
            <div className="clearance-tag">
              {isOrganizer ? (
                <>
                  <ShieldCheck size={14} className="text-primary" />
                  <span>Command Center Access Active</span>
                </>
              ) : (
                <>
                  <UserCheck size={14} className="text-cyan" />
                  <span>Attendee Companion Clearance</span>
                </>
              )}
            </div>
          </div>

          <div className="dropdown-divider" />

          <button
            id="user-logout-btn"
            className="dropdown-logout-btn"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      <style>{`
        .signin-nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2));
          border: 1px solid var(--border-active);
          color: var(--text-primary);
          padding: 7px 14px;
          border-radius: var(--radius-full);
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .signin-nav-btn:hover {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(6, 182, 212, 0.35));
          box-shadow: 0 0 15px var(--primary-glow);
          transform: translateY(-1px);
        }

        .user-profile-menu-container {
          position: relative;
        }

        .user-trigger-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid var(--border-subtle);
          padding: 4px 10px 4px 5px;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.2s;
        }
        .user-trigger-btn:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(30, 41, 59, 0.9);
        }
        .organizer-glow:hover {
          border-color: var(--primary);
          box-shadow: 0 0 12px var(--primary-glow);
        }
        .visitor-glow:hover {
          border-color: var(--cyan);
          box-shadow: 0 0 12px var(--cyan-glow);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.78rem;
          color: #ffffff;
        }
        .user-avatar.organizer {
          background: linear-gradient(135deg, var(--primary), #4f46e5);
        }
        .user-avatar.visitor {
          background: linear-gradient(135deg, var(--cyan), #0284c7);
        }

        .user-info-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .user-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.1;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-role-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }
        .role-organizer {
          color: #a5b4fc;
        }
        .role-visitor {
          color: #67e8f9;
        }

        .dropdown-arrow {
          color: var(--text-muted);
          transition: transform 0.2s;
        }
        .dropdown-arrow.rotate {
          transform: rotate(180deg);
        }

        .user-dropdown-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 250px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid var(--border-active);
          border-radius: var(--radius-md);
          box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.8);
          padding: 14px;
          z-index: 1050;
          animation: scaleUp 0.15s ease-out;
        }

        .dropdown-user-details {
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
        }
        .dropdown-full-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .dropdown-email {
          font-size: 0.78rem;
          color: var(--text-muted);
          word-break: break-all;
        }

        .clearance-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.04);
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          margin-top: 4px;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 10px 0;
        }

        .dropdown-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #f87171;
          padding: 8px;
          border-radius: var(--radius-sm);
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dropdown-logout-btn:hover {
          background: rgba(239, 68, 68, 0.12);
        }
      `}</style>
    </div>
  );
}
