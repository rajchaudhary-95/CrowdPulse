import React, { useState } from 'react';
import MetricsHeader from '../components/MetricsHeader';
import MapView from '../components/MapView';
import AlertsFeed from '../components/AlertsFeed';
import OptimizationPanel from '../components/OptimizationPanel';
import WhatIfDrawer from '../components/WhatIfDrawer';

export default function OrganizerDashboard({
  zones = [],
  venues = [],
  transitEdges = [],
  alerts = [],
  recommendations = [],
  forecast = {},
  whatIfOverrides = {},
  onUpdateScenario,
  onResetScenario,
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  return (
    <div className="dashboard-container">
      {/* 1. Global Metrics Banner */}
      <MetricsHeader
        zones={zones}
        transitEdges={transitEdges}
        alerts={alerts}
        forecast={forecast}
      />

      {/* 2. Main Geospatial & Intelligence Grid */}
      <div className="main-intel-grid">
        {/* Left Column: Interactive Leaflet Map */}
        <div className="map-column">
          <MapView
            zones={zones}
            transitEdges={transitEdges}
            venues={venues}
            forecast={forecast}
            selectedZoneId={selectedZoneId}
            onSelectZone={setSelectedZoneId}
          />
        </div>

        {/* Right Column: Live Breach Alerts & LP Optimization Solver */}
        <div className="intelligence-column">
          <div className="intel-panel-item">
            <OptimizationPanel
              recommendations={recommendations}
              onSelectZone={setSelectedZoneId}
            />
          </div>
          <div className="intel-panel-item">
            <AlertsFeed
              alerts={alerts}
              onSelectZone={setSelectedZoneId}
            />
          </div>
        </div>
      </div>

      {/* 3. Bottom What-If Interactive Slider Drawer */}
      <WhatIfDrawer
        whatIfOverrides={whatIfOverrides}
        onUpdateScenario={onUpdateScenario}
        onResetScenario={onResetScenario}
      />

      <style>{`
        .dashboard-container {
          padding: 20px 24px;
          max-width: 1700px;
          margin: 0 auto;
        }
        .main-intel-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 16px;
          min-height: 540px;
        }
        @media (max-width: 1080px) {
          .main-intel-grid {
            grid-template-columns: 1fr;
          }
        }
        .map-column {
          min-height: 480px;
          height: 100%;
        }
        .intelligence-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }
        .intel-panel-item {
          flex: 1;
          min-height: 250px;
        }
      `}</style>
    </div>
  );
}
