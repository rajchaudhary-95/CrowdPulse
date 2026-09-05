import React from 'react';
import { AlertCircle, AlertTriangle, Info, Bell, CheckCircle2 } from 'lucide-react';

export default function AlertsFeed({ alerts = [], onSelectZone }) {
  return (
    <div className="alerts-panel glass-panel">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Bell size={18} className="text-warning" />
          <h3 className="panel-title">Breach & Risk Alerts</h3>
        </div>
        <span className="badge badge-warning">{alerts.length} Active</span>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="empty-alerts">
            <CheckCircle2 size={32} className="text-success" />
            <p className="empty-title">All Zones Within Tolerances</p>
            <span className="empty-sub">No safety breaches or gridlocks detected in the perimeter.</span>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

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
                    <span className="alert-type-tag">{alert.type.replace('_', ' ')}</span>
                  </div>
                  <span className="alert-time">
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                  </span>
                </div>

                <h4 className="alert-title">{alert.title}</h4>
                <p className="alert-message">{alert.message}</p>

                {alert.recommendedAction && (
                  <div className="alert-action-box">
                    <span className="action-tag">ACTION</span>
                    <p className="action-text">{alert.recommendedAction}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .alerts-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 480px;
          overflow: hidden;
        }
        .panel-header {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(15, 23, 42, 0.5);
        }
        .panel-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .panel-title {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .alerts-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .alert-item {
          background: rgba(15, 23, 42, 0.7);
          border-radius: var(--radius-sm);
          border-left: 4px solid var(--primary);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-top: 1px solid var(--border-subtle);
          border-right: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
        }
        .alert-item:hover {
          background: rgba(30, 41, 59, 0.8);
          transform: translateX(2px);
        }
        .alert-item.critical {
          border-left-color: var(--status-critical);
          background: rgba(239, 68, 68, 0.08);
        }
        .alert-item.warning {
          border-left-color: var(--status-warning);
          background: rgba(249, 115, 22, 0.08);
        }
        .alert-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .alert-badge-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .alert-type-tag {
          font-size: 0.675rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .alert-time {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: monospace;
        }
        .alert-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .alert-message {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .alert-action-box {
          background: rgba(0, 0, 0, 0.35);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          padding: 6px 8px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          margin-top: 2px;
        }
        .action-tag {
          font-size: 0.6rem;
          font-weight: 800;
          background: var(--primary);
          color: white;
          padding: 1px 4px;
          border-radius: 3px;
        }
        .action-text {
          font-size: 0.725rem;
          color: #e2e8f0;
          line-height: 1.3;
        }
        .empty-alerts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          gap: 8px;
        }
        .empty-title {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .empty-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .text-danger { color: var(--status-critical); }
        .text-warning { color: var(--status-warning); }
        .text-success { color: var(--status-normal); }
        .text-cyan { color: var(--cyan); }
      `}</style>
    </div>
  );
}
