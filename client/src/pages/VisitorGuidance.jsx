import React, { useState, useEffect } from 'react';
import { Compass, Clock, Navigation, CheckCircle, AlertCircle, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import MapView from '../components/MapView';
import { fetchRouteRecommendation } from '../services/api';

export default function VisitorGuidance({
  zones = [],
  transitEdges = [],
  venues = [],
  forecast = {},
  recommendations = [],
}) {
  const [originZoneId, setOriginZoneId] = useState('zone-transit-hub');
  const [destZoneId, setDestZoneId] = useState('zone-main-arena');
  const [routePlan, setRoutePlan] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Auto-fetch route recommendation when origin or destination changes
  useEffect(() => {
    let isMounted = true;
    async function loadRoute() {
      if (!originZoneId || !destZoneId || originZoneId === destZoneId) {
        setRoutePlan(null);
        return;
      }
      setLoadingRoute(true);
      try {
        const data = await fetchRouteRecommendation(originZoneId, destZoneId);
        if (isMounted) setRoutePlan(data);
      } catch (err) {
        console.warn('Failed to fetch route recommendation:', err);
      } finally {
        if (isMounted) setLoadingRoute(false);
      }
    }
    loadRoute();
    return () => { isMounted = false; };
  }, [originZoneId, destZoneId]);

  // Find lowest stress alternate zone
  const recommendedZones = [...zones].sort(
    (a, b) => (a.liveMetrics?.compositeStressScore || 0) - (b.liveMetrics?.compositeStressScore || 0)
  );
  const topComfortZone = recommendedZones[0];

  // Attendee recommendations generated from LP solver
  const visitorTips = recommendations.filter((r) => r.targetAudience === 'visitor');

  return (
    <div className="visitor-container">
      {/* 1. Hero Guidance Banner */}
      <div className="visitor-hero glass-panel">
        <div className="hero-left">
          <div className="hero-badge">
            <Compass size={16} /> ATTENDEE REAL-TIME TRAVEL ADVISOR
          </div>
          <h2 className="hero-title">Plan Your Visit Around the Crowd</h2>
          <p className="hero-subtitle">
            Live AI-powered crowd forecasting guides you away from peak stadium turnstiles towards comfortable viewing zones and optimal travel windows.
          </p>
        </div>

        <div className="hero-status-card">
          <span className="status-kicker">Recommended Travel Window</span>
          <div className="window-time-row">
            <Clock size={20} className="text-cyan" />
            <span className="window-time">Immediate &mdash; Next 40 Mins</span>
          </div>
          <span className="status-note">
            &bull; Peak stadium track finals surge starts in ~50 minutes.
          </span>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="visitor-grid">
        {/* Left Column: Route Planner & Alternate Recommendations */}
        <div className="planner-column">
          {/* Smart Route Planner Card */}
          <div className="route-card glass-panel">
            <div className="route-header">
              <div className="icon-badge">
                <Navigation size={18} className="text-cyan" />
              </div>
              <div>
                <h3 className="card-title">Live Crowd-Aware Route Planner</h3>
                <span className="card-subtitle">Real-time transit delays and concourse crowding</span>
              </div>
            </div>

            <div className="selector-grid">
              <div className="selector-group">
                <label className="selector-label">
                  <MapPin size={13} /> Starting Location
                </label>
                <select
                  id="origin-zone-select"
                  className="custom-select"
                  value={originZoneId}
                  onChange={(e) => setOriginZoneId(e.target.value)}
                >
                  {zones.map((z) => (
                    <option key={z._id} value={z._id}>
                      {z.name} ({z.liveMetrics?.compositeStressScore}% stress)
                    </option>
                  ))}
                </select>
              </div>

              <div className="selector-group">
                <label className="selector-label">
                  <MapPin size={13} /> Destination
                </label>
                <select
                  id="dest-zone-select"
                  className="custom-select"
                  value={destZoneId}
                  onChange={(e) => setDestZoneId(e.target.value)}
                >
                  {zones.map((z) => (
                    <option key={z._id} value={z._id}>
                      {z.name} ({z.liveMetrics?.compositeStressScore}% stress)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Route Results */}
            {originZoneId === destZoneId ? (
              <div className="route-info-box">
                <p>You are already in this zone! Explore local dining and exhibition halls below.</p>
              </div>
            ) : routePlan ? (
              <div className="route-results-wrap">
                <div className="route-option primary">
                  <div className="option-top">
                    <span className="route-badge direct">DIRECT TRANSIT</span>
                    <span className="route-eta">{routePlan.primaryRoute?.estimatedMinutes} mins</span>
                  </div>
                  <h4 className="route-corridor">{routePlan.primaryRoute?.edgeName}</h4>
                  <div className="route-meta">
                    <span>Mode: <strong>{routePlan.primaryRoute?.mode?.replace('_', ' ').toUpperCase()}</strong></span>
                    <span>&bull;</span>
                    <span className={`rating ${routePlan.primaryRoute?.crowdednessRating?.includes('High') ? 'high' : 'good'}`}>
                      {routePlan.primaryRoute?.crowdednessRating}
                    </span>
                  </div>
                </div>

                {routePlan.alternateRecommendation && (
                  <div className="route-option alternate">
                    <div className="option-top">
                      <span className="route-badge smart">
                        <Sparkles size={11} /> AI RECOMMENDATION
                      </span>
                      <span className="relief-tag">Save ~15 min</span>
                    </div>
                    <h4 className="route-corridor">Visit {routePlan.alternateRecommendation.zoneName} Instead</h4>
                    <p className="alternate-reason">{routePlan.alternateRecommendation.reason}</p>
                    <div className="alternate-action-row">
                      <span className="comfort-score">Comfort Index: {100 - routePlan.alternateRecommendation.stressScore}%</span>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => setDestZoneId(routePlan.alternateRecommendation.zoneId)}
                      >
                        Switch Destination <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="route-loading">Calculating optimal path...</div>
            )}
          </div>

          {/* "Skip the Queues" Alternate Zones Card */}
          <div className="alternate-zones-card glass-panel">
            <div className="card-top-row">
              <h3 className="card-title">Skip the Queues: Uncrowded Fan Zones</h3>
              <span className="badge badge-normal">Open Availability</span>
            </div>
            <p className="card-subtitle">
              Avoid stadium concourse bottlenecks. These adjacent clusters have live megascreens, open food pavilions, and under 50% capacity:
            </p>

            <div className="zones-list">
              {recommendedZones.slice(0, 3).map((z) => {
                const stress = z.liveMetrics?.compositeStressScore || 0;
                return (
                  <div key={z._id} className="zone-rec-item">
                    <div className="zone-rec-left">
                      <span className="zone-rec-name">{z.name}</span>
                      <span className="zone-rec-cat">{z.category.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    <div className="zone-rec-right">
                      <span className="zone-stress-pill" style={{ color: stress < 60 ? '#10b981' : '#f59e0b' }}>
                        {stress}% Congestion
                      </span>
                      <button
                        className="btn-primary btn-xs"
                        onClick={() => setDestZoneId(z._id)}
                      >
                        Route Me
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map */}
        <div className="map-column">
          <MapView
            zones={zones}
            transitEdges={transitEdges}
            venues={venues}
            forecast={forecast}
            selectedZoneId={destZoneId}
            onSelectZone={(zId) => setDestZoneId(zId)}
            isVisitorView={true}
          />
        </div>
      </div>

      <style>{`
        .visitor-container {
          padding: 20px 24px;
          max-width: 1700px;
          margin: 0 auto;
        }
        .visitor-hero {
          padding: 20px 24px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .hero-left {
          max-width: 700px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--cyan);
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .hero-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .hero-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .hero-status-card {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid var(--border-glow);
          border-radius: var(--radius-md);
          padding: 14px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .status-kicker {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
        }
        .window-time-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .window-time {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .status-note {
          font-size: 0.75rem;
          color: var(--status-elevated);
        }
        .visitor-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 20px;
        }
        @media (max-width: 1080px) {
          .visitor-grid {
            grid-template-columns: 1fr;
          }
        }
        .planner-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .route-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .route-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .icon-badge {
          width: 36px;
          height: 36px;
          background: rgba(6, 182, 212, 0.12);
          border: 1px solid var(--border-glow);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-title {
          font-size: 1rem;
          font-weight: 700;
        }
        .card-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .selector-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .selector-label {
          font-size: 0.725rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .custom-select {
          background: #0b1120;
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          outline: none;
        }
        .custom-select:focus {
          border-color: var(--primary);
        }
        .route-results-wrap {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .route-option {
          border-radius: var(--radius-sm);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .route-option.primary {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
        }
        .route-option.alternate {
          background: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.35);
        }
        .option-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .route-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .route-badge.direct {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
        }
        .route-badge.smart {
          background: linear-gradient(135deg, var(--cyan), var(--primary));
          color: white;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .route-eta {
          font-weight: 700;
          font-size: 0.95rem;
          font-family: 'Outfit', sans-serif;
          color: var(--text-primary);
        }
        .relief-tag {
          font-size: 0.725rem;
          color: var(--status-normal);
          font-weight: 700;
        }
        .route-corridor {
          font-size: 0.9rem;
          font-weight: 700;
        }
        .route-meta {
          display: flex;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .rating.high { color: var(--status-warning); font-weight: 600; }
        .rating.good { color: var(--status-normal); font-weight: 600; }
        .alternate-reason {
          font-size: 0.775rem;
          color: #cbd5e1;
          line-height: 1.4;
        }
        .alternate-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 6px;
        }
        .comfort-score {
          font-size: 0.75rem;
          color: var(--cyan);
          font-weight: 600;
        }
        .btn-xs {
          padding: 4px 8px;
          font-size: 0.7rem;
        }
        .alternate-zones-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .zones-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .zone-rec-item {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }
        .zone-rec-item:hover {
          background: rgba(30, 41, 59, 0.7);
        }
        .zone-rec-left {
          display: flex;
          flex-direction: column;
        }
        .zone-rec-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .zone-rec-cat {
          font-size: 0.675rem;
          color: var(--text-muted);
        }
        .zone-rec-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .zone-stress-pill {
          font-size: 0.75rem;
          font-weight: 700;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}
