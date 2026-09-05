import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Circle, Popup, Tooltip, useMap } from 'react-leaflet';
import { Users, AlertTriangle, Bus, TrendingUp, Flame, Compass, Shield, MapPin, Maximize2 } from 'lucide-react';

// Helper to resolve stress color
function getStressColor(stressScore) {
  if (stressScore >= 88) return '#ef4444'; // Red (Critical)
  if (stressScore >= 75) return '#f97316'; // Orange (Warning)
  if (stressScore >= 60) return '#f59e0b'; // Amber (Elevated)
  return '#10b981'; // Green (Normal)
}

function getEdgeColor(congestionLevel) {
  switch (congestionLevel) {
    case 'gridlock': return '#ef4444';
    case 'heavy': return '#f97316';
    case 'moderate': return '#38bdf8';
    case 'free_flow':
    default: return '#10b981';
  }
}

// Emergency evacuation corridors for mega-event perimeter
const EVACUATION_CORRIDORS = [
  {
    id: 'evac-corridor-north',
    name: 'North Emergency Egress Corridor',
    path: [[28.5865, 77.2345], [28.5915, 77.2310], [28.5960, 77.2280]],
  },
  {
    id: 'evac-corridor-south',
    name: 'South Rapid Medical Evac Route',
    path: [[28.5805, 77.2280], [28.5765, 77.2370], [28.5720, 77.2400]],
  },
];

// Helper component to center map smoothly
function MapRecenter({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({
  zones = [],
  transitEdges = [],
  venues = [],
  forecast = {},
  selectedZoneId = null,
  onSelectZone = () => {},
  isVisitorView = false,
}) {
  const defaultCenter = [28.5835, 77.2350];
  const defaultZoom = 14;

  // Active layer visibility toggles
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [showEvac, setShowEvac] = useState(false);
  const [showZones, setShowZones] = useState(true);

  const zoneForecasts = forecast?.zoneForecasts || {};

  // Resolve selected zone coordinates if any
  const selectedZone = zones.find((z) => (z._id || z.id) === selectedZoneId);
  const targetCenter = selectedZone?.geoCenter
    ? [selectedZone.geoCenter.lat, selectedZone.geoCenter.lng]
    : null;

  return (
    <div className="map-view-wrapper glass-panel">
      {/* Map Header & Multi-Layer Control Bar */}
      <div className="map-header">
        <div className="map-title-row">
          <span className="map-badge">GEOSPATIAL LIVE PERIMETER</span>
          <div className="map-legend">
            <span className="legend-item"><span className="legend-dot normal"></span> Nominal (&lt;60%)</span>
            <span className="legend-item"><span className="legend-dot elevated"></span> Elevated (60-75%)</span>
            <span className="legend-item"><span className="legend-dot warning"></span> Warning (75-88%)</span>
            <span className="legend-item"><span className="legend-dot critical"></span> Critical (&gt;88%)</span>
          </div>
        </div>

        {/* Tactical Layer Toggle Toolbar */}
        <div className="layer-toolbar">
          <button
            className={`layer-toggle-btn ${showHeatmap ? 'active' : ''}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
            title="Toggle Continuous Crowd Density Heatmap"
          >
            <Flame size={13} />
            <span>Heatmap</span>
          </button>

          <button
            className={`layer-toggle-btn ${showTransit ? 'active' : ''}`}
            onClick={() => setShowTransit(!showTransit)}
            title="Toggle Live Transit Flow Polylines"
          >
            <Compass size={13} />
            <span>Transit Flow</span>
          </button>

          <button
            className={`layer-toggle-btn ${showEvac ? 'active' : ''}`}
            onClick={() => setShowEvac(!showEvac)}
            title="Toggle Emergency Evacuation Corridors"
          >
            <Shield size={13} />
            <span>Evacuation Routes</span>
          </button>

          <button
            className={`layer-toggle-btn ${showZones ? 'active' : ''}`}
            onClick={() => setShowZones(!showZones)}
            title="Toggle Venue Perimeter Polygons"
          >
            <MapPin size={13} />
            <span>Venues</span>
          </button>
        </div>
      </div>

      <div className="map-canvas-container">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          attributionControl={false}
          className="leaflet-map-canvas"
        >
          {targetCenter && <MapRecenter center={targetCenter} zoom={15} />}

          {/* Dark / Clean OpenStreetMap Tile Layer */}
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />

          {/* 1. Heatmap Layer: Density Blobs around Zone Centers */}
          {showHeatmap && zones.map((zone) => {
            if (!zone.geoCenter) return null;
            const stress = zone.liveMetrics?.compositeStressScore || 50;
            const heatRadius = Math.max(160, Math.min(420, (stress / 100) * 400));
            const heatColor = getStressColor(stress);

            return (
              <Circle
                key={`heat-${zone._id || zone.id}`}
                center={[zone.geoCenter.lat, zone.geoCenter.lng]}
                radius={heatRadius}
                pathOptions={{
                  fillColor: heatColor,
                  fillOpacity: Math.min(0.45, 0.15 + (stress / 100) * 0.3),
                  color: heatColor,
                  weight: 1,
                  opacity: 0.5,
                }}
              />
            );
          })}

          {/* 2. Transit Edges (Polylines) */}
          {showTransit && transitEdges.map((edge) => {
            const edgeColor = getEdgeColor(edge.liveStatus?.congestionLevel);
            const isSelected = selectedZoneId && (edge.fromZoneId === selectedZoneId || edge.toZoneId === selectedZoneId);

            return (
              <Polyline
                key={edge._id || edge.id}
                positions={edge.pathCoordinates || []}
                pathOptions={{
                  color: edgeColor,
                  weight: isSelected ? 5.5 : 3.8,
                  opacity: isSelected ? 0.95 : 0.75,
                  dashArray: edge.mode === 'metro' ? '6, 6' : null,
                }}
              >
                <Popup>
                  <div className="popup-card">
                    <h4 className="popup-title">{edge.name}</h4>
                    <p className="popup-subtitle">Mode: <strong>{edge.mode?.replace(/_/g, ' ').toUpperCase()}</strong></p>
                    <div className="popup-stat-grid">
                      <div className="popup-stat">
                        <span className="stat-label">Flow / hr</span>
                        <span className="stat-val">{edge.liveStatus?.currentFlowPerHour?.toLocaleString()}</span>
                      </div>
                      <div className="popup-stat">
                        <span className="stat-label">Utilization</span>
                        <span className="stat-val">{Math.round((edge.liveStatus?.utilizationRate || 0) * 100)}%</span>
                      </div>
                      <div className="popup-stat">
                        <span className="stat-label">Status</span>
                        <span className={`stat-val ${edge.liveStatus?.congestionLevel}`}>
                          {edge.liveStatus?.congestionLevel?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* 3. Emergency Evacuation Corridors */}
          {showEvac && EVACUATION_CORRIDORS.map((corridor) => (
            <Polyline
              key={corridor.id}
              positions={corridor.path}
              pathOptions={{
                color: '#10b981',
                weight: 4,
                opacity: 0.9,
                dashArray: '8, 8',
              }}
            >
              <Tooltip sticky>
                <span style={{ fontWeight: 700, color: '#10b981' }}>🛡️ {corridor.name} (Clear)</span>
              </Tooltip>
            </Polyline>
          ))}

          {/* 4. Zone Boundaries & Venues */}
          {showZones && zones.map((zone) => {
            const zid = zone._id || zone.id;
            const isSelected = selectedZoneId === zid;
            const stressScore = zone.liveMetrics?.compositeStressScore || 0;
            const zoneColor = getStressColor(stressScore);
            const boundaryCoords = zone.geoBoundary?.coordinates?.[0]?.map((coord) => [coord[1], coord[0]]) || [];
            const forecastData = zoneForecasts[zid];

            return (
              <React.Fragment key={zid}>
                {boundaryCoords.length > 0 && (
                  <Polygon
                    positions={boundaryCoords}
                    pathOptions={{
                      color: zoneColor,
                      weight: isSelected ? 3.5 : 2,
                      fillColor: zoneColor,
                      fillOpacity: isSelected ? 0.35 : 0.18,
                    }}
                    eventHandlers={{
                      click: () => onSelectZone(zid),
                    }}
                  >
                    <Tooltip sticky>
                      <div className="map-tooltip">
                        <strong>{zone.name}</strong>
                        <div>Occupancy: {zone.liveMetrics?.currentVenueOccupancy?.toLocaleString()}</div>
                        <div>Stress Score: {stressScore}%</div>
                      </div>
                    </Tooltip>

                    <Popup>
                      <div className="popup-card">
                        <div className="popup-header-row">
                          <h4 className="popup-title">{zone.name}</h4>
                          <span className="popup-badge" style={{ backgroundColor: `${zoneColor}25`, color: zoneColor }}>
                            {zone.liveMetrics?.status?.toUpperCase()}
                          </span>
                        </div>

                        <p className="popup-category">{zone.category?.replace(/_/g, ' ').toUpperCase()}</p>

                        <div className="popup-stat-grid">
                          <div className="popup-stat">
                            <span className="stat-label">Live Attendees</span>
                            <span className="stat-val">{zone.liveMetrics?.currentVenueOccupancy?.toLocaleString()}</span>
                          </div>
                          <div className="popup-stat">
                            <span className="stat-label">Total Capacity</span>
                            <span className="stat-val">{zone.totalCapacity?.venue?.toLocaleString()}</span>
                          </div>
                          <div className="popup-stat">
                            <span className="stat-label">Transit Pressure</span>
                            <span className="stat-val">{Math.round((zone.liveMetrics?.currentTransitPressure || 0) * 100)}%</span>
                          </div>
                          <div className="popup-stat">
                            <span className="stat-label">Stress Score</span>
                            <span className="stat-val" style={{ color: zoneColor }}>{stressScore}/100</span>
                          </div>
                        </div>

                        {forecastData && (
                          <div className="popup-forecast-box">
                            <span className="forecast-tag">PROJECTED (NEXT 60M)</span>
                            <div className="forecast-row">
                              <span>Projected Stress:</span>
                              <strong style={{ color: getStressColor(forecastData.projectedStress) }}>
                                {forecastData.projectedStress}%
                              </strong>
                            </div>
                            <div className="forecast-row">
                              <span>Risk Level:</span>
                              <strong className={`risk-${forecastData.riskLevel}`}>
                                {forecastData.riskLevel?.toUpperCase()}
                              </strong>
                            </div>
                          </div>
                        )}

                        <button
                          className="popup-focus-btn"
                          onClick={() => onSelectZone(zid)}
                        >
                          Focus Telemetry
                        </button>
                      </div>
                    </Popup>
                  </Polygon>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      <style>{`
        .map-view-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .map-header {
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.85);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .map-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .map-badge {
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--cyan);
          background: rgba(6, 182, 212, 0.12);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .map-legend {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: var(--text-secondary);
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
        }
        .legend-dot.normal { background: var(--status-normal); }
        .legend-dot.elevated { background: var(--status-elevated); }
        .legend-dot.warning { background: var(--status-warning); }
        .legend-dot.critical { background: var(--status-critical); }

        .layer-toolbar {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .layer-toggle-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          padding: 3px 9px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .layer-toggle-btn:hover {
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .layer-toggle-btn.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: var(--primary);
          color: #ffffff;
          box-shadow: 0 0 8px var(--primary-glow);
        }

        .map-canvas-container {
          flex: 1;
          min-height: 480px;
          position: relative;
        }
        .leaflet-map-canvas {
          width: 100%;
          height: 100%;
          min-height: 480px;
          background: #090d16;
        }

        .popup-card {
          color: var(--text-primary);
          font-family: inherit;
          min-width: 220px;
          padding: 4px;
        }
        .popup-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .popup-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .popup-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .popup-category {
          font-size: 0.7rem;
          color: #64748b;
          margin-bottom: 8px;
        }

        .popup-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 10px;
        }
        .popup-stat {
          background: #f1f5f9;
          padding: 5px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 0.65rem;
          color: #64748b;
        }
        .stat-val {
          font-size: 0.82rem;
          font-weight: 700;
          color: #0f172a;
        }

        .popup-forecast-box {
          background: #e2e8f0;
          padding: 6px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .forecast-tag {
          font-size: 0.62rem;
          font-weight: 700;
          color: #475569;
          display: block;
          margin-bottom: 2px;
        }
        .forecast-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #1e293b;
        }

        .popup-focus-btn {
          width: 100%;
          background: #4f46e5;
          color: #ffffff;
          border: none;
          padding: 6px;
          border-radius: 4px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }
        .popup-focus-btn:hover {
          background: #4338ca;
        }

        .map-tooltip {
          font-family: inherit;
          font-size: 0.78rem;
        }
      `}</style>
    </div>
  );
}
