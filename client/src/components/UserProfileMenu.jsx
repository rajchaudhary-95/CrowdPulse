import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, ShieldCheck, UserCheck, ChevronDown } from 'lucide-react';

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
        className="signin-nav-btn font-mono"
        onClick={() => promptLogin()}
        title="Sign in with your CrowdPulse account"
      >
        <LogIn size={14} />
        <span>Sign In</span>
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
        className={`user-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="View User Account & Role"
        aria-expanded={isOpen}
      >
        <div className={`user-avatar ${isOrganizer ? 'organizer' : 'visitor'}`}>
          {initials}
        </div>
        <div className="user-info-text">
          <span className="user-name font-display">{user.fullName || user.email.split('@')[0]}</span>
          <span className={`user-role-badge font-mono ${isOrganizer ? 'role-organizer' : 'role-visitor'}`}>
            {isOrganizer ? 'ORGANIZER' : 'VISITOR'}
          </span>
        </div>
        <ChevronDown size={14} className={`dropdown-arrow ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="user-dropdown-panel" role="menu">
          <div className="dropdown-header">
            <div className="dropdown-user-details">
              <span className="dropdown-full-name font-display">{user.fullName || 'Authorized User'}</span>
              <span className="dropdown-email font-mono">{user.email}</span>
            </div>
            <div className={`clearance-tag font-mono ${isOrganizer ? 'organizer' : 'visitor'}`}>
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
            className="dropdown-logout-btn font-mono"
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
          gap: 6px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #0f172a;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .signin-nav-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0284c7;
        }

        .user-profile-menu-container {
          position: relative;
        }

        .user-trigger-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 4px 12px 4px 5px;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
          transition: all 0.15s ease;
        }
        .user-trigger-btn:hover,
        .user-trigger-btn.active {
          background: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.78rem;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        .user-avatar.organizer {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
        }
        .user-avatar.visitor {
          background: linear-gradient(135deg, #0284c7, #0ea5e9);
        }

        .user-info-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .user-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.1;
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-role-badge {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }
        .role-organizer {
          color: #4f46e5;
        }
        .role-visitor {
          color: #0284c7;
        }

        .dropdown-arrow {
          color: #94a3b8;
          transition: transform 0.2s ease;
        }
        .dropdown-arrow.rotate {
          transform: rotate(180deg);
          color: #0f172a;
        }

        .user-dropdown-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 260px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04);
          padding: 16px;
          z-index: 1050;
          animation: scaleUp 0.15s ease-out;
        }

        .dropdown-user-details {
          display: flex;
          flex-direction: column;
          margin-bottom: 8px;
        }
        .dropdown-full-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
        }
        .dropdown-email {
          font-size: 0.74rem;
          color: #64748b;
          word-break: break-all;
          margin-top: 2px;
        }

        .clearance-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 6px 10px;
          border-radius: 8px;
          margin-top: 8px;
        }
        .clearance-tag.organizer {
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          color: #4338ca;
        }
        .clearance-tag.visitor {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
        }

        .dropdown-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 12px 0 8px;
        }

        .dropdown-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: #e11d48;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dropdown-logout-btn:hover {
          background: #fff1f2;
          color: #be123c;
        }
      `}</style>
    </div>
  );
}
