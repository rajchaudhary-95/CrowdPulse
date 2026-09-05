import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, Lock, Mail, User, X, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    intendedRoleRequired,
    login,
    register,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState(intendedRoleRequired || 'organizer');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (intendedRoleRequired) {
      setSelectedRole(intendedRoleRequired);
    }
  }, [intendedRoleRequired]);

  // Keyboard dismiss with Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isAuthModalOpen) {
        setIsAuthModalOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'signin') {
        await login(email, password);
      } else {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const res = await register({
          email,
          password,
          fullName,
          role: selectedRole,
        });
        if (res?.needsConfirmation) {
          setActiveTab('signin');
          setErrorMsg('Account registered! Please enter your password to sign in.');
        }
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('already registered')) {
        setActiveTab('signin');
        setErrorMsg('This account is already registered! Enter your password below to sign in.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={() => setIsAuthModalOpen(false)}>
      <div className="auth-modal glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          className="auth-close-btn"
          onClick={() => setIsAuthModalOpen(false)}
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon-badge">
            <Lock size={20} className="text-primary" />
          </div>
          <h2 className="auth-title">
            {activeTab === 'signin' ? 'Sign In to CrowdPulse' : 'Create an Account'}
          </h2>
          <p className="auth-subtitle">
            {intendedRoleRequired === 'organizer'
              ? 'Operational clearance is required to access the Organizer Command Center.'
              : 'Real-time mega-event orchestration and attendee navigation portal.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-bar">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="auth-error-banner">
            <AlertCircle size={16} className="text-danger flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {activeTab === 'register' && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commander Sarah Chen"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Account Role Clearance</label>
                <div className="role-selector-grid">
                  <div
                    className={`role-option-card ${selectedRole === 'organizer' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('organizer')}
                  >
                    <div className="role-option-header">
                      <ShieldCheck size={18} className="text-primary" />
                      <span className="role-option-title">Event Operations</span>
                    </div>
                    <p className="role-option-desc">
                      Full access to Command Center, LP Solver, incident playbooks, and what-if controls.
                    </p>
                  </div>

                  <div
                    className={`role-option-card ${selectedRole === 'visitor' ? 'selected' : ''}`}
                    onClick={() => setSelectedRole('visitor')}
                  >
                    <div className="role-option-header">
                      <UserCheck size={18} className="text-cyan" />
                      <span className="role-option-title">Event Visitor</span>
                    </div>
                    <p className="role-option-desc">
                      Traffic-light crowd guidance, queue-free navigation, and personalized live alerts.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                required
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="btn-spinner">Authenticating...</span>
            ) : (
              <>
                <span>{activeTab === 'signin' ? 'Sign In to Portal' : 'Register & Enter'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-note">
          <Sparkles size={13} className="text-cyan" />
          <span>Secured with Supabase PostgreSQL Row-Level Security</span>
        </div>
      </div>

      <style>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 7, 15, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 16px;
          animation: fadeIn 0.2s ease-out;
        }

        .auth-modal {
          background: rgba(15, 23, 42, 0.94);
          border: 1px solid rgba(99, 102, 241, 0.35);
          border-radius: var(--radius-lg);
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.2);
          width: 100%;
          max-width: 460px;
          padding: 28px;
          position: relative;
          animation: scaleUp 0.25s ease-out;
        }

        .auth-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-close-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .auth-icon-badge {
          width: 44px;
          height: 44px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .auth-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .auth-subtitle {
          font-size: 0.84rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .auth-tab-bar {
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          padding: 4px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          margin-bottom: 20px;
        }
        .auth-tab {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 9px;
          font-size: 0.88rem;
          font-weight: 600;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-tab.active {
          background: var(--primary);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.4);
        }

        .auth-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          margin-bottom: 16px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }
        .form-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 14px 10px 38px;
          color: var(--text-primary);
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        }

        .role-selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .role-option-card {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .role-option-card:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .role-option-card.selected {
          background: rgba(99, 102, 241, 0.12);
          border-color: var(--primary);
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.25);
        }
        .role-option-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .role-option-desc {
          font-size: 0.74rem;
          color: var(--text-muted);
          line-height: 1.35;
        }

        .auth-submit-btn {
          margin-top: 6px;
          background: linear-gradient(135deg, var(--primary), #4f46e5);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-sm);
          padding: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
          transition: all 0.2s;
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }
        .auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-footer-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 18px;
          font-size: 0.76rem;
          color: var(--text-muted);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
