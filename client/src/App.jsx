import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OrganizerDashboard from './pages/OrganizerDashboard';
import VisitorGuidance from './pages/VisitorGuidance';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { socket } from './services/socket';
import { fetchState, updateScenario, resetScenario, reseedDatabase } from './services/api';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function App() {
  const { isOrganizer, promptLogin, user, role } = useAuth();

  // Navigation: Support URL Hash (#/organizer or #/visitor)
  const initialHashView = window.location.hash.includes('organizer') ? 'organizer' : 'visitor';
  const [activeView, setActiveView] = useState(initialHashView);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isReseeding, setIsReseeding] = useState(false);

  // System Real-Time State
  const [systemState, setSystemState] = useState({
    simulatedTime: new Date(),
    speedMultiplier: 1,
    isPaused: false,
    whatIfOverrides: { demandSurgeMultiplier: 1.0 },
    zones: [],
    venues: [],
    transitEdges: [],
    forecast: {},
    alerts: [],
    recommendations: [],
  });

  // Guard activeView: If user switches to organizer but is not authorized, prompt login
  const handleViewChange = (view) => {
    if (view === 'organizer' && !isOrganizer) {
      promptLogin('organizer');
      return;
    }
    setActiveView(view);
    window.location.hash = `/${view}`;
  };

  // Sync with auth changes
  useEffect(() => {
    if (activeView === 'organizer' && !isOrganizer) {
      // If unauthorized, default to visitor companion
      setActiveView('visitor');
      window.location.hash = '/visitor';
    }
  }, [isOrganizer]);

  useEffect(() => {
    // 1. Initial REST fetch
    fetchState()
      .then((data) => {
        if (data) setSystemState((prev) => ({ ...prev, ...data }));
      })
      .catch((err) => console.warn('Initial REST fetch fallback:', err.message));

    // 2. Socket.io Real-Time Event Handlers
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }
    function onLiveTick(payload) {
      if (payload) {
        setSystemState((prev) => ({
          ...prev,
          ...payload,
        }));
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('live:tick', onLiveTick);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('live:tick', onLiveTick);
    };
  }, []);

  const handleUpdateScenario = async (overrides) => {
    try {
      socket.emit('scenario:update', overrides);
      await updateScenario(overrides);
    } catch (err) {
      console.error('Failed to update scenario:', err);
    }
  };

  const handleResetScenario = async () => {
    try {
      socket.emit('scenario:reset');
      await resetScenario();
    } catch (err) {
      console.error('Failed to reset scenario:', err);
    }
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await reseedDatabase();
      const freshState = await fetchState();
      if (freshState) setSystemState(freshState);
    } catch (err) {
      console.error('Failed to reseed:', err);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="app-root">
      {/* Global Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={handleViewChange}
        simulatedTime={systemState.simulatedTime}
        isConnected={isConnected}
        onReseed={handleReseed}
        isReseeding={isReseeding}
      />

      {/* Main View Router */}
      <main className="app-main">
        {activeView === 'organizer' ? (
          isOrganizer ? (
            <OrganizerDashboard
              zones={systemState.zones}
              venues={systemState.venues}
              transitEdges={systemState.transitEdges}
              alerts={systemState.alerts}
              recommendations={systemState.recommendations}
              forecast={systemState.forecast}
              whatIfOverrides={systemState.whatIfOverrides}
              onUpdateScenario={handleUpdateScenario}
              onResetScenario={handleResetScenario}
            />
          ) : (
            <div className="clearance-guard-card glass-panel">
              <ShieldAlert size={48} className="text-warning" />
              <h2>Operational Clearance Required</h2>
              <p>
                The Organizer Command Center is restricted to verified event operations personnel and incident commanders.
              </p>
              <button
                className="guard-login-btn"
                onClick={() => promptLogin('organizer')}
              >
                <span>Sign In as Event Organizer</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )
        ) : (
          <VisitorGuidance
            zones={systemState.zones}
            transitEdges={systemState.transitEdges}
            venues={systemState.venues}
            forecast={systemState.forecast}
            recommendations={systemState.recommendations}
          />
        )}
      </main>

      {/* Global Authentication Modal */}
      <AuthModal />

      <style>{`
        .app-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .app-main {
          flex: 1;
        }

        .clearance-guard-card {
          max-width: 520px;
          margin: 60px auto;
          padding: 36px 28px;
          border-radius: var(--radius-lg);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .clearance-guard-card h2 {
          font-size: 1.35rem;
          color: var(--text-primary);
        }
        .clearance-guard-card p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.45;
        }
        .guard-login-btn {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--primary), #4338ca);
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 15px var(--primary-glow);
          transition: all 0.2s;
        }
        .guard-login-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px var(--primary-glow);
        }
      `}</style>
    </div>
  );
}
