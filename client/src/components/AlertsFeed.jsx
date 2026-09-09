import React, { useState } from 'react';
import { AlertCircle, Bell, Radio, Check } from 'lucide-react';
import { executePlaybookAction } from '../services/api';

export default function AlertsFeed({ alerts = [], onSelectZone, onAlertActionExecuted }) {
  const [resolvedIds, setResolvedIds] = useState({});
  const [actionInProgress, setActionInProgress] = useState({});

  const handleAction = async (alertId, btnName) => {
    const actionKey = btnName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const key = `${alertId}-${btnName}`;
    setActionInProgress((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await executePlaybookAction(alertId, actionKey, { btnName });
      if (onAlertActionExecuted) {
        onAlertActionExecuted(alertId, actionKey, res?.summary || `Action executed: ${btnName}`);
      }
    } catch (err) {
      console.warn('Action dispatch feedback:', err.message);
    } finally {
      setActionInProgress((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleResolve = async (alertId) => {
    setResolvedIds((prev) => ({ ...prev, [alertId]: true }));
    try {
      const res = await executePlaybookAction(alertId, 'resolve');
      if (onAlertActionExecuted) {
        onAlertActionExecuted(alertId, 'resolve', res?.summary || 'Alert marked as resolved.');
      }
    } catch (err) {
      console.warn('Alert resolve error:', err.message);
    }
  };

  // Mock list populated from live alerts or fallbacks to match exact design
  // Use live alerts from props if present, fallback to default high-fidelity alerts
  const alertItems = (alerts && alerts.length > 0)
    ? alerts.map((a, idx) => ({
        id: a.id || `alert-${idx}`,
        type: a.severity === 'critical' ? 'CRITICAL BREACH' : 'ELEVATED TRANSIT SPILL',
        time: a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '14:32:10 UTC',
        sector: a.zoneId ? a.zoneId.replace('zone-', 'SEC-').toUpperCase() : (idx === 0 ? 'SEC-01' : 'SEC-04'),
        title: a.title || (idx === 0 ? 'Main Arena Turnstiles at 98% capacity threshold.' : 'Shuttle Station B headway delayed 7m.'),
        desc: a.message || a.recommendedAction || 'Concourse bottleneck active.',
        severity: a.severity || (idx === 0 ? 'critical' : 'elevated'),
        buttons: a.severity === 'critical' ? ['Auto-Reroute', 'Push Advisory', 'Dispatch Stewards'] : ['Auto-Reroute', 'Push Advisory'],
      }))
    : [
        {
          id: 'alert-1',
          type: 'CRITICAL BREACH',
          time: '14:32:10 UTC',
          sector: 'SEC-01',
          title: 'Main Arena Turnstiles at 98% capacity threshold.',
          desc: 'Concourse bottleneck active. Surge egress impending from stage pyrotechnics completion.',
          severity: 'critical',
          buttons: ['Auto-Reroute', 'Push Advisory', 'Dispatch Stewards'],
        },
        {
          id: 'alert-2',
          type: 'ELEVATED TRANSIT SPILL',
          time: '14:34:04 UTC',
          sector: 'SEC-04',
          title: 'Shuttle Station B headway delayed 7m.',
          desc: 'Pedestrian crowd overspill across Terminal loop lane 2.',
          severity: 'elevated',
          buttons: ['Auto-Reroute', 'Push Advisory'],
        },
      ];

  const activeAlerts = alertItems.filter((a) => !resolvedIds[a.id]);

  return (
    <div className="alerts-card glass-panel">
      {/* Header */}
      <div className="alerts-header">
        <div className="alerts-title-row">
          <AlertCircle size={18} className="text-error" />
          <h3 className="alerts-title">Active Sector Breaches</h3>
        </div>
        <span className="unresolved-badge font-mono">
          {activeAlerts.length} UNRESOLVED
        </span>
      </div>

      {/* Alert Feed List */}
      <div className="alerts-stream">
        {activeAlerts.map((alert) => {
          const isCrit = alert.severity === 'critical';

          return (
            <div
              key={alert.id}
              className={`alert-entry ${isCrit ? 'critical-glow' : 'warning-glow'}`}
            >
              <div className={`accent-bar ${isCrit ? 'bg-error' : 'bg-warning'}`} />

              <div className="alert-top-row">
                <div className="alert-meta-left font-mono">
                  <span className={`alert-type-tag ${isCrit ? 'text-error' : 'text-warning'}`}>
                    {alert.type}
                  </span>
                  <span className="alert-timestamp">{alert.time}</span>
                </div>
                <span className={`sector-pill font-mono ${isCrit ? 'crit' : 'elev'}`}>
                  {alert.sector}
                </span>
              </div>

              <h4 className="alert-headline">{alert.title}</h4>
              <p className="alert-body">{alert.desc}</p>

              <div className="alert-actions-bar">
                {alert.buttons.map((btnName, idx) => {
                  const isPrimaryBtn = isCrit && idx === 0;
                  const loading = actionInProgress[`${alert.id}-${btnName}`];

                  return (
                    <button
                      key={btnName}
                      className={`alert-action-btn font-mono ${isPrimaryBtn ? 'btn-highlight' : ''}`}
                      onClick={() => handleAction(alert.id, btnName)}
                      disabled={loading}
                    >
                      {loading ? 'DISPATCHING...' : btnName.toUpperCase()}
                    </button>
                  );
                })}
                <button
                  className="btn-resolve font-mono"
                  onClick={() => handleResolve(alert.id)}
                >
                  RESOLVE
                </button>
              </div>
            </div>
          );
        })}

        {activeAlerts.length === 0 && (
          <div className="empty-alerts">
            <Check size={20} className="text-success" />
            <span>All sector alerts resolved. Normal status restored.</span>
          </div>
        )}
      </div>

      <style>{`
        .alerts-card {
          padding: 20px 22px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 12px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .alerts-card:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
          border-color: rgba(99, 102, 241, 0.25);
        }

        .alerts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .alerts-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .alerts-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }
        .unresolved-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: #e11d48;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .alerts-stream {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-entry {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 14px 16px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .alert-entry.critical-glow {
          background: #fff1f2;
          border-color: #fecdd3;
          box-shadow: 0 2px 8px rgba(225, 29, 72, 0.06);
        }
        .alert-entry.warning-glow {
          background: #fffbeb;
          border-color: #fde68a;
          box-shadow: 0 2px 8px rgba(180, 83, 9, 0.06);
        }

        .accent-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }
        .bg-error { background: #e11d48; }
        .bg-warning { background: #b45309; }

        .alert-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .alert-meta-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .alert-type-tag {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
        }
        .alert-timestamp {
          font-size: 0.68rem;
          color: #64748b;
        }

        .sector-pill {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .sector-pill.crit {
          color: #e11d48;
          background: #fff1f2;
          border: 1px solid #fecdd3;
        }
        .sector-pill.elev {
          color: #b45309;
          background: #fffbeb;
          border: 1px solid #fde68a;
        }

        .alert-headline {
          font-size: 0.88rem;
          font-weight: 600;
          color: #0f172a;
          margin-top: 2px;
        }
        .alert-body {
          font-size: 0.74rem;
          color: #475569;
          line-height: 1.35;
        }

        .alert-actions-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 6px;
          padding-top: 8px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }
        .alert-action-btn {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 4px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .alert-action-btn:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .alert-action-btn.btn-highlight {
          background: #0f172a;
          border-color: #0f172a;
          color: #ffffff;
        }
        .alert-action-btn.btn-highlight:hover {
          background: #1e293b;
        }

        .btn-resolve {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          padding: 4px 6px;
          transition: color 0.15s;
        }
        .btn-resolve:hover {
          color: #0f172a;
        }

        .empty-alerts {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px;
          color: #059669;
          font-size: 0.8rem;
          justify-content: center;
        }

        .text-error { color: #e11d48; }
        .text-warning { color: #b45309; }
      `}</style>
    </div>
  );
}
