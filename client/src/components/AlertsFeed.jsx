import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Bell,
  CheckCircle2,
  Zap,
  Radio,
  Shield,
  Check,
  History,
  Clock
} from 'lucide-react';
import { executePlaybookAction } from '../services/api';

export default function AlertsFeed({ alerts = [], onSelectZone, onAlertActionExecuted }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'critical' | 'audit'
  const [actionInProgress, setActionInProgress] = useState({});
  const [actionFeedbacks, setActionFeedbacks] = useState({});
  const [auditEntries, setAuditEntries] = useState([]);

  const handlePlaybookAction = async (alert, actionType) => {
    const key = `${alert.id}-${actionType}`;
    setActionInProgress((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await executePlaybookAction(alert.id, actionType);
      const feedbackText = res?.summary || `Intervention ${actionType} dispatched successfully.`;

      setActionFeedbacks((prev) => ({
        ...prev,
        [alert.id]: feedbackText,
      }));

      // Record in local audit trail
      setAuditEntries((prev) => [
        {
          id: `local-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          action: actionType.toUpperCase(),
          summary: feedbackText,
          alertTitle: alert.title || alert.message,
        },
        ...prev.slice(0, 30),
      ]);

      if (onAlertActionExecuted) onAlertActionExecuted(res);
    } catch (err) {
      setActionFeedbacks((prev) => ({
        ...prev,
        [alert.id]: `Intervention recorded: ${err.message || 'Updated locally'}`,
      }));
    } finally {
      setActionInProgress((prev) => ({ ...prev, [key]: false }));
      // Clear feedback after 4 seconds
      setTimeout(() => {
        setActionFeedbacks((prev) => {
          const copy = { ...prev };
          delete copy[alert.id];
          return copy;
        });
      }, 4000);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === 'critical') return a.severity === 'critical';
    return true;
  });

  return (
    <div className="alerts-panel glass-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Bell size={18} className="text-warning" />
          <h3 className="panel-title">Incident Triage & Playbooks</h3>
        </div>

        {/* Tab Filters */}
        <div className="tab-pill-group">
          <button
            className={`tab-pill-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            All ({alerts.length})
          </button>
          <button
            className={`tab-pill-btn ${activeTab === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveTab('critical')}
          >
            Critical ({alerts.filter((a) => a.severity === 'critical').length})
          </button>
          <button
            className={`tab-pill-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <History size={13} />
            Audit ({auditEntries.length})
          </button>
        </div>
      </div>

      {/* Audit Log View */}
      {activeTab === 'audit' ? (
        <div className="audit-feed-list">
          {auditEntries.length === 0 ? (
            <div className="empty-alerts">
              <Clock size={28} className="text-muted" />
              <p className="empty-title">Audit Trail Ready</p>
              <span className="empty-sub">Operator interventions and playbook dispatches will log here chronologically.</span>
            </div>
          ) : (
            auditEntries.map((log) => (
              <div key={log.id} className="audit-entry-card">
                <div className="audit-entry-header">
                  <span className="audit-badge">{log.action}</span>
                  <span className="audit-time">{log.time}</span>
                </div>
                <p className="audit-summary">{log.summary}</p>
                <span className="audit-target">Target: {log.alertTitle}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Alerts List View */
        <div className="alerts-list">
          {filteredAlerts.length === 0 ? (
            <div className="empty-alerts">
              <CheckCircle2 size={32} className="text-success" />
              <p className="empty-title">Perimeter Secure</p>
              <span className="empty-sub">All venue zones, corridors, and transit edges are currently operating within nominal safety thresholds.</span>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';
              const feedback = actionFeedbacks[alert.id];

              return (
                <div
                  key={alert.id}
                  className={`alert-item ${alert.severity}`}
                  onClick={() => alert.zoneId && onSelectZone && onSelectZone(alert.zoneId)}
                >
                  <div className="alert-top">
                    <div className="alert-badge-wrap">
                      {isCritical ? (
                        <AlertCircle size={15} className="text-danger" />
                      ) : isWarning ? (
                        <AlertTriangle size={15} className="text-warning" />
                      ) : (
                        <Info size={15} className="text-cyan" />
                      )}
                      <span className="alert-type-tag">{alert.type?.replace(/_/g, ' ')}</span>
                      {alert.zoneName && (
                        <span className="alert-zone-tag">📍 {alert.zoneName}</span>
                      )}
                    </div>
                    <span className="alert-time">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                    </span>
                  </div>

                  <h4 className="alert-title">{alert.title || alert.message}</h4>
                  <p className="alert-message">{alert.message}</p>

                  {/* Incident Response Playbook Toolbar */}
                  <div className="playbook-toolbar" onClick={(e) => e.stopPropagation()}>
                    <span className="playbook-label">OPERATIONAL INTERVENTION:</span>
                    <div className="playbook-btn-row">
                      <button
                        className="playbook-btn reroute-btn"
                        title="Auto-reroute incoming attendee flow via LP Simplex redistribution"
                        onClick={() => handlePlaybookAction(alert, 'auto_reroute')}
                        disabled={actionInProgress[`${alert.id}-auto_reroute`]}
                      >
                        <Zap size={13} />
                        <span>Auto-Reroute</span>
                      </button>

                      <button
                        className="playbook-btn advisory-btn"
                        title="Broadcast real-time travel delay notification to attendee mobile feeds"
                        onClick={() => handlePlaybookAction(alert, 'broadcast_advisory')}
                        disabled={actionInProgress[`${alert.id}-broadcast_advisory`]}
                      >
                        <Radio size={13} />
                        <span>Push Advisory</span>
                      </button>

                      <button
                        className="playbook-btn steward-btn"
                        title="Dispatch perimeter stewards and security marshals"
                        onClick={() => handlePlaybookAction(alert, 'dispatch_stewards')}
                        disabled={actionInProgress[`${alert.id}-dispatch_stewards`]}
                      >
                        <Shield size={13} />
                        <span>Dispatch Stewards</span>
                      </button>

                      <button
                        className="playbook-btn resolve-btn"
                        title="Mark alert as addressed and cleared"
                        onClick={() => handlePlaybookAction(alert, 'resolve')}
                        disabled={actionInProgress[`${alert.id}-resolve`]}
                      >
                        <Check size={13} />
                        <span>Resolve</span>
                      </button>
                    </div>

                    {/* Action Execution Feedback */}
                    {feedback && (
                      <div className="playbook-feedback">
                        <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                        <span>{feedback}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <style>{`
        .alerts-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 380px;
          max-height: 540px;
          overflow: hidden;
        }
        .panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(15, 23, 42, 0.7);
        }
        .panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .panel-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tab-pill-group {
          display: flex;
          background: rgba(0, 0, 0, 0.4);
          padding: 3px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }
        .tab-pill-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-pill-btn:hover {
          color: var(--text-primary);
        }
        .tab-pill-btn.active {
          background: var(--primary);
          color: #ffffff;
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .alerts-list, .audit-feed-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 36px 16px;
          gap: 8px;
        }
        .empty-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .empty-sub {
          font-size: 0.8rem;
          color: var(--text-muted);
          max-width: 320px;
          line-height: 1.4;
        }

        .alert-item {
          background: rgba(15, 23, 42, 0.85);
          border-radius: var(--radius-sm);
          border-left: 4px solid var(--primary);
          border-top: 1px solid var(--border-subtle);
          border-right: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .alert-item:hover {
          background: rgba(30, 41, 59, 0.9);
          transform: translateY(-1px);
        }
        .alert-item.critical {
          border-left-color: var(--status-critical);
          background: rgba(239, 68, 68, 0.08);
        }
        .alert-item.warning {
          border-left-color: var(--status-warning);
          background: rgba(249, 115, 22, 0.06);
        }

        .alert-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .alert-badge-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .alert-type-tag {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
        }
        .alert-zone-tag {
          font-size: 0.72rem;
          color: var(--cyan);
          background: rgba(6, 182, 212, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .alert-time {
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .alert-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .alert-message {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.35;
          margin-bottom: 8px;
        }

        .playbook-toolbar {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .playbook-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.04em;
          display: block;
          margin-bottom: 6px;
        }
        .playbook-btn-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .playbook-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          background: rgba(0, 0, 0, 0.35);
          color: var(--text-primary);
        }
        .reroute-btn:hover {
          background: rgba(99, 102, 241, 0.25);
          border-color: var(--primary);
          color: #ffffff;
        }
        .advisory-btn:hover {
          background: rgba(6, 182, 212, 0.25);
          border-color: var(--cyan);
          color: #ffffff;
        }
        .steward-btn:hover {
          background: rgba(245, 158, 11, 0.25);
          border-color: #f59e0b;
          color: #ffffff;
        }
        .resolve-btn:hover {
          background: rgba(16, 185, 129, 0.25);
          border-color: #10b981;
          color: #ffffff;
        }

        .playbook-feedback {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.76rem;
          margin-top: 8px;
        }

        .audit-entry-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px;
        }
        .audit-entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .audit-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--cyan);
          background: rgba(6, 182, 212, 0.15);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .audit-time {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .audit-summary {
          font-size: 0.8rem;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .audit-target {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
