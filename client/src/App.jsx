import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OrganizerDashboard from './pages/OrganizerDashboard';
import VisitorGuidance from './pages/VisitorGuidance';
import { socket } from './services/socket';
import { fetchState, updateScenario, resetScenario, reseedDatabase } from './services/api';

export default function App() {
  // Navigation: Support URL Hash (#/organizer or #/visitor)
  const initialView = window.location.hash.includes('visitor') ? 'visitor' : 'organizer';
  const [activeView, setActiveView] = useState(initialView);
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

  // Sync active view with window hash
  const handleViewChange = (view) => {
    setActiveView(view);
    window.location.hash = `/${view}`;
  };

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
      <Navbar
        activeView={activeView}
        setActiveView={handleViewChange}
        simulatedTime={systemState.simulatedTime}
        isConnected={isConnected}
        onReseed={handleReseed}
        isReseeding={isReseeding}
      />

      <main className="app-main">
        {activeView === 'organizer' ? (
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
          <VisitorGuidance
            zones={systemState.zones}
            transitEdges={systemState.transitEdges}
            venues={systemState.venues}
            forecast={systemState.forecast}
            recommendations={systemState.recommendations}
          />
        )}
      </main>

      <style>{`
        .app-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .app-main {
          flex: 1;
        }
      `}</style>
    </div>
  );
}
