import React from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Popup, Tooltip } from 'react-leaflet';
import { Users, AlertTriangle, Bus, TrendingUp } from 'lucide-react';

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

  const zoneForecasts = forecast?.zoneForecasts || {};

  return (
    <div className="map-view-wrapper glass-panel">
      <div className="map-header">
        <div className="map-title-row">
          <span className="map-badge">GEOSPATIAL LIVE PERIMETER</span>
          <div className="map-legend">
            <span className="legend-item"><span className="legend-dot normal"></span> Normal (&lt;60%)</span>
            <span className="legend-item"><span className="legend-dot elevated"></span> Elevated (60-75%)</span>
            <span className="legend-item"><span className="legend-dot warning"></span> Warning (75-88%)</span>
            <span className="legend-item"><span className="legend-dot critical"></span> Critical (&gt;88%)</span>
          </div>
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
          {/* Free-tier OpenStreetMap Tile Layer */}
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />

          {/* Transit Edges (Polylines) */}
          {transitEdges.map((edge) => {
            const edgeColor = getEdgeColor(edge.liveStatus?.congestionLevel);
            const isSelected = selectedZoneId && (edge.fromZoneId === selectedZoneId || edge.toZoneId === selectedZoneId);

            return (
              <Polyline
                key={edge._id}
                positions={edge.pathCoordinates || []}
                pathOptions={{
                  color: edgeColor,
                  weight: isSelected ? 5 : 3.5,
                  opacity: isSelected ? 0.95 : 0.75,
                  dashArray: edge.mode === 'metro' ? '6, 6' : null,
                }}
              >
                <Popup>
                  <div className="popup-card">
                    <h4 className="popup-title">{edge.name}</h4>
                    <p className="popup-subtitle">Mode: <strong>{edge.mode.replace('_', ' ').toUpperCase()}</strong></p>
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

          {/* Zone Polygons */}
          {zones.map((zone) => {
            const stress = zone.liveMetrics?.compositeStressScore || 0;
            const fillColor = getStressColor(stress);
            const isSelected = selectedZoneId === zone._id;
            const zoneForecast = zoneForecasts[zone._id];

            return (
              <Polygon
                key={zone._id}
                positions={zone.geoBoundary?.coordinates || []}
                eventHandlers={{
                  click: () => onSelectZone(zone._id),
                }}
                pathOptions={{
                  color: isSelected ? '#ffffff' : fillColor,
                  weight: isSelected ? 3 : 1.8,
                  fillColor: fillColor,
                  fillOpacity: isSelected ? 0.55 : 0.35,
                }}
              >
                <Tooltip direction="center" permanent={false} opacity={0.95}>
                  <div className="map-tooltip">
                    <strong>{zone.name}</strong>
                    <span>Stress: {stress}%</span>
                  </div>
                </Tooltip>

                <Popup>
                  <div className="popup-card">
                    <div className="popup-header-row">
                      <h4 className="popup-title">{zone.name}</h4>
                      <span className={`badge badge-${zone.liveMetrics?.status || 'normal'}`}>
                        {zone.liveMetrics?.status}
                      </span>
                    </div>
                    <p className="popup-category">Category: {zone.category.replace('_', ' ').toUpperCase()}</p>

                    <div className="popup-stat-grid">
                      <div className="popup-stat">
                        <span className="stat-label">Occupancy</span>
                        <span className="stat-val">
                          {zone.liveMetrics?.currentVenueOccupancy?.toLocaleString()} / {zone.totalCapacity?.venue?.toLocaleString()}
                        </span>
                      </div>
                      <div className="popup-stat">
                        <span className="stat-label">Transit Pressure</span>
                        <span className="stat-val">
                          {Math.round((zone.liveMetrics?.currentTransitPressure || 0) * 100)}%
                        </span>
                      </div>
                      <div className="popup-stat">
                        <span className="stat-label">Stress Index</span>
                        <span className="stat-val font-bold" style={{ color: fillColor }}>
                          {stress}%
                        </span>
                      </div>
                    </div>

                    {zoneForecast && (
                      <div className="popup-forecast-badge">
                        <TrendingUp size={14} />
                        <span>Projected 1hr Stress: <strong>{zoneForecast.projectedStress}%</strong> ({zoneForecast.riskLevel.toUpperCase()})</span>
                      </div>
                    )}

                    <button
                      className="btn-primary popup-action-btn"
                      onClick={() => onSelectZone(zone._id)}
                    >
                      Inspect Zone Telemetry
                    </button>
                  </div>
                </Popup>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      <style>{`
        .map-view-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 480px;
          overflow: hidden;
        }
        .map-header {
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(15, 23, 42, 0.6);
        }
        .map-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .map-badge {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--cyan);
        }
        .map-legend {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .legend-dot.normal { background: var(--status-normal); box-shadow: 0 0 6px var(--status-normal); }
        .legend-dot.elevated { background: var(--status-elevated); box-shadow: 0 0 6px var(--status-elevated); }
        .legend-dot.warning { background: var(--status-warning); box-shadow: 0 0 6px var(--status-warning); }
        .legend-dot.critical { background: var(--status-critical); box-shadow: 0 0 6px var(--status-critical); }

        .map-canvas-container {
          flex: 1;
          position: relative;
          min-height: 420px;
        }
        .leaflet-map-canvas {
          height: 100% !important;
          min-height: 420px;
        }
        .popup-card {
          min-width: 240px;
          color: var(--text-primary);
        }
        .popup-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 4px;
        }
        .popup-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
        }
        .popup-subtitle, .popup-category {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .popup-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: rgba(0, 0, 0, 0.25);
          padding: 8px;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
          margin-bottom: 10px;
        }
        .popup-stat {
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .stat-val {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .stat-val.gridlock, .stat-val.heavy { color: var(--status-warning); }
        .stat-val.free_flow { color: var(--status-normal); }
        .popup-forecast-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #c7d2fe;
          padding: 6px 10px;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .popup-action-btn {
          width: 100%;
          justify-content: center;
          font-size: 0.775rem;
          padding: 6px 12px;
        }
        .map-tooltip {
          display: flex;
          flex-direction: column;
          font-size: 0.75rem;
          background: #0f172a;
          color: #f8fafc;
          padding: 4px 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
