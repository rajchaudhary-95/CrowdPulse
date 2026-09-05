import React, { useState, useEffect } from 'react';
import {
  Compass,
  Clock,
  Navigation,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  Utensils,
  Coffee,
  TreePine,
  Tv,
  Footprints,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import MapView from '../components/MapView';
import { fetchRouteRecommendation } from '../services/api';

// Traffic light status helper
function getTrafficLight(stressScore) {
  if (stressScore >= 80) {
    return {
      dot: '🔴',
      label: 'Heavy Congestion',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.12)',
      advice: 'Long entry queues (15-20 min wait). Consider delaying transit.',
    };
  }
  if (stressScore >= 60) {
    return {
      dot: '🟡',
      label: 'Moderate Traffic',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      advice: 'Steady movement with short wait times at checkpoints (4-7 min).',
    };
  }
  return {
    dot: '🟢',
    label: 'Smooth & Clear',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    advice: 'No lines! Turnstiles and concourses are flowing freely.',
  };
}

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
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'food' | 'rest' | 'screens'
  const [savedSpots, setSavedSpots] = useState({});

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

  const toggleSaveSpot = (zoneId) => {
    setSavedSpots((prev) => ({
      ...prev,
      [zoneId]: !prev[zoneId],
    }));
  };

  // Curated category recommendations
  const categorySpots = {
    food: [
      { name: 'Grand Concourse Food Promenade', zoneId: 'zone-promenade', wait: '< 4 min wait', desc: 'Craft food trucks, quick refreshment stations & hydration taps' },
      { name: 'Fan Festival Village Food Court', zoneId: 'zone-fan-park', wait: '< 6 min wait', desc: 'Covered seating and rapid festival dining stalls' },
    ],
    rest: [
      { name: 'Olympic Village Shaded Lawn', zoneId: 'zone-fan-park', wait: 'Open seating', desc: 'Quiet relaxation lawn with cooling misters and restrooms' },
      { name: 'North Aquatic Gardens', zoneId: 'zone-north-courts', wait: 'Uncrowded', desc: 'Scenic shaded walk with zero congestion' },
    ],
    screens: [
      { name: 'Live Symphony Giant LED Wall', zoneId: 'zone-fan-park', wait: 'Free Entry', desc: 'High-definition 4K stadium broadcast with surround sound' },
    ],
  };

  return (
    <div className="visitor-container">
      {/* 1. Hero Travel Advisory Banner */}
      <div className="visitor-hero glass-panel">
        <div className="hero-left">
          <div className="hero-badge">
            <Compass size={15} /> VISITOR LIVE COMPANION
          </div>
          <h2 className="hero-title">Navigate Without the Crowds</h2>
          <p className="hero-subtitle">
            Real-time crowd intelligence finds open walkways and tells you the best time to move between venues.
          </p>
        </div>

        {/* Intuitive Traffic Light Summary Card */}
        <div className="hero-travel-window-card">
          <div className="window-header">
            <Clock size={16} className="text-cyan" />
            <span className="window-title">Optimal Travel Window</span>
          </div>
          <div className="window-status-row">
            <span className="window-badge">🟢 Right Now &mdash; Next 35 Mins</span>
          </div>
          <p className="window-hint">
            Stadium track finals wrap up in ~45 mins. Leave now to reach transit before the main egress rush!
          </p>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="visitor-grid">
        {/* Left Column: Friction-Free Route Finder & Quick Spots */}
        <div className="planner-column">
          {/* Smart Route Planner Card */}
          <div className="route-card glass-panel">
            <div className="route-card-header">
              <div className="route-icon-badge">
                <Navigation size={18} className="text-cyan" />
              </div>
              <div>
                <h3 className="card-title">Where Are You Heading?</h3>
                <span className="card-subtitle">Choose your stops to find the smoothest walking path</span>
              </div>
            </div>

            {/* Quick Origin & Destination Selector */}
            <div className="selector-grid">
              <div className="selector-group">
                <label className="selector-label">
                  <MapPin size={13} className="text-cyan" /> I am currently at:
                </label>
                <select
                  id="origin-zone-select"
                  className="custom-select"
                  value={originZoneId}
                  onChange={(e) => setOriginZoneId(e.target.value)}
                >
                  {zones.map((z) => {
                    const zid = z._id || z.id;
                    const tl = getTrafficLight(z.liveMetrics?.compositeStressScore || 0);
                    return (
                      <option key={zid} value={zid}>
                        {tl.dot} {z.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="selector-group">
                <label className="selector-label">
                  <Navigation size={13} className="text-primary" /> I want to go to:
                </label>
                <select
                  id="dest-zone-select"
                  className="custom-select"
                  value={destZoneId}
                  onChange={(e) => setDestZoneId(e.target.value)}
                >
                  {zones.map((z) => {
                    const zid = z._id || z.id;
                    const tl = getTrafficLight(z.liveMetrics?.compositeStressScore || 0);
                    return (
                      <option key={zid} value={zid} disabled={zid === originZoneId}>
                        {tl.dot} {z.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Route Results Comparison */}
            {loadingRoute ? (
              <div className="route-loading">
                <div className="loading-spinner" />
                <span>Checking concourse crowding and live turnstiles...</span>
              </div>
            ) : routePlan ? (
              <div className="route-options-container">
                {/* Recommended Alternate Route (Crowd-Free) */}
                {routePlan.alternateRecommendation && (
                  <div className="route-option-card recommended">
                    <div className="route-option-badge">
                      <Sparkles size={13} />
                      <span>RECOMMENDED &bull; CROWD-FREE PATH</span>
                    </div>

                    <div className="route-option-body">
                      <div className="route-time-stat">
                        <span className="route-minutes font-num text-success">
                          {routePlan.alternateRecommendation.estimatedMinutes} min
                        </span>
                        <span className="route-comfort-pill">🟢 Open Walkway</span>
                      </div>

                      <div className="route-details">
                        <p className="route-path-name">
                          Via {routePlan.alternateRecommendation.corridorName}
                        </p>
                        <p className="route-path-desc">
                          {routePlan.alternateRecommendation.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Route */}
                {routePlan.primaryRoute && (
                  <div className="route-option-card direct">
                    <div className="route-option-header-sub">
                      <span className="direct-label">Fastest Direct Route:</span>
                      <span className={`crowd-badge ${routePlan.primaryRoute.crowdednessRating}`}>
                        {routePlan.primaryRoute.crowdednessRating}
                      </span>
                    </div>

                    <div className="route-option-body">
                      <div className="route-time-stat">
                        <span className="route-minutes font-num">
                          {routePlan.primaryRoute.estimatedMinutes} min
                        </span>
                      </div>
                      <div className="route-details">
                        <p className="route-path-name">{routePlan.primaryRoute.edgeName}</p>
                        <p className="route-path-desc">
                          {routePlan.primaryRoute.crowdNote || 'Direct route through standard concourse gates.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="route-prompt">
                <Footprints size={24} className="text-muted" />
                <p>Select different start and destination venues to see live walking times.</p>
              </div>
            )}
          </div>

          {/* Skip the Queues & Venue Quick Cards */}
          <div className="spots-card glass-panel">
            <div className="spots-header">
              <div className="spots-title-group">
                <Sparkles size={17} className="text-cyan" />
                <h3 className="card-title">Skip the Queues Nearby</h3>
              </div>

              {/* Category Filter Chips */}
              <div className="category-chips">
                <button
                  className={`chip ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  All Zones
                </button>
                <button
                  className={`chip ${activeCategory === 'food' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('food')}
                >
                  <Utensils size={12} /> Food
                </button>
                <button
                  className={`chip ${activeCategory === 'rest' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('rest')}
                >
                  <TreePine size={12} /> Chill Spots
                </button>
                <button
                  className={`chip ${activeCategory === 'screens' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('screens')}
                >
                  <Tv size={12} /> Big Screens
                </button>
              </div>
            </div>

            {/* Spots List */}
            <div className="spots-list">
              {activeCategory === 'all' ? (
                zones.map((zone) => {
                  const zid = zone._id || zone.id;
                  const tl = getTrafficLight(zone.liveMetrics?.compositeStressScore || 0);
                  const isSaved = Boolean(savedSpots[zid]);

                  return (
                    <div key={zid} className="spot-item-card">
                      <div className="spot-item-top">
                        <div className="spot-name-group">
                          <span className="spot-traffic-dot">{tl.dot}</span>
                          <div>
                            <h4 className="spot-name">{zone.name}</h4>
                            <span className="spot-traffic-label" style={{ color: tl.color }}>
                              {tl.label}
                            </span>
                          </div>
                        </div>

                        <button
                          className={`bookmark-btn ${isSaved ? 'saved' : ''}`}
                          onClick={() => toggleSaveSpot(zid)}
                          title="Save to My Event"
                        >
                          <Bookmark size={15} />
                        </button>
                      </div>

                      <p className="spot-advice">{tl.advice}</p>

                      <div className="spot-footer">
                        <button
                          className="spot-route-btn"
                          onClick={() => {
                            setDestZoneId(zid);
                            window.scrollTo({ top: 150, behavior: 'smooth' });
                          }}
                        >
                          <span>Directions Here</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                (categorySpots[activeCategory] || []).map((spot, idx) => (
                  <div key={idx} className="spot-item-card">
                    <div className="spot-item-top">
                      <div>
                        <h4 className="spot-name">{spot.name}</h4>
                        <span className="spot-wait-tag text-success">🟢 {spot.wait}</span>
                      </div>
                    </div>
                    <p className="spot-advice">{spot.desc}</p>
                    <button
                      className="spot-route-btn"
                      onClick={() => {
                        setDestZoneId(spot.zoneId);
                        window.scrollTo({ top: 150, behavior: 'smooth' });
                      }}
                    >
                      <span>Directions Here</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map View */}
        <div className="map-column">
          <MapView
            zones={zones}
            transitEdges={transitEdges}
            venues={venues}
            forecast={forecast}
            selectedZoneId={destZoneId}
            onSelectZone={(zid) => setDestZoneId(zid)}
            isVisitorView={true}
          />
        </div>
      </div>

      <style>{`
        .visitor-container {
          padding: 16px 24px;
          max-width: 1600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Hero Banner */
        .visitor-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-radius: var(--radius-md);
          flex-wrap: wrap;
          gap: 16px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(6, 182, 212, 0.08));
          border: 1px solid rgba(6, 182, 212, 0.25);
        }
        .hero-left {
          max-width: 680px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--cyan);
          background: rgba(6, 182, 212, 0.12);
          padding: 3px 10px;
          border-radius: var(--radius-full);
          margin-bottom: 8px;
        }
        .hero-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .hero-subtitle {
          font-size: 0.86rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .hero-travel-window-card {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(6, 182, 212, 0.25);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          max-width: 380px;
        }
        .window-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .window-title {
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .window-status-row {
          margin-bottom: 4px;
        }
        .window-badge {
          font-size: 0.92rem;
          font-weight: 700;
          color: #34d399;
        }
        .window-hint {
          font-size: 0.76rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        /* Two-Column Grid */
        .visitor-grid {
          display: grid;
          grid-template-columns: 1.1fr 1.3fr;
          gap: 16px;
          min-height: 580px;
        }
        @media (max-width: 1040px) {
          .visitor-grid {
            grid-template-columns: 1fr;
          }
        }

        .planner-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .map-column {
          min-height: 520px;
          height: 100%;
        }

        /* Route Planner Card */
        .route-card {
          border-radius: var(--radius-md);
          padding: 18px;
        }
        .route-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .route-icon-badge {
          width: 38px;
          height: 38px;
          background: rgba(6, 182, 212, 0.15);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .card-subtitle {
          font-size: 0.76rem;
          color: var(--text-muted);
        }

        .selector-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }
        @media (max-width: 600px) {
          .selector-grid {
            grid-template-columns: 1fr;
          }
        }
        .selector-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .selector-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .custom-select {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          outline: none;
          cursor: pointer;
        }
        .custom-select:focus {
          border-color: var(--cyan);
        }

        .route-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
          color: var(--text-muted);
          font-size: 0.84rem;
        }
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-top-color: var(--cyan);
          border-radius: var(--radius-full);
          animation: spin 0.8s linear infinite;
        }

        .route-options-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .route-option-card {
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          border: 1px solid var(--border-subtle);
          background: rgba(0, 0, 0, 0.25);
        }
        .route-option-card.recommended {
          background: rgba(6, 182, 212, 0.08);
          border-color: rgba(6, 182, 212, 0.35);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.12);
        }
        .route-option-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--cyan);
          margin-bottom: 6px;
        }
        .route-option-header-sub {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .direct-label {
          font-size: 0.74rem;
          color: var(--text-muted);
        }
        .crowd-badge {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }

        .route-option-body {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .route-time-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 65px;
        }
        .route-minutes {
          font-size: 1.25rem;
          font-weight: 800;
        }
        .route-comfort-pill {
          font-size: 0.68rem;
          color: #34d399;
          font-weight: 700;
        }
        .route-details {
          flex: 1;
        }
        .route-path-name {
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .route-path-desc {
          font-size: 0.76rem;
          color: var(--text-secondary);
          line-height: 1.35;
        }

        .route-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.82rem;
        }

        /* Skip the Queues Spots Card */
        .spots-card {
          border-radius: var(--radius-md);
          padding: 16px;
        }
        .spots-header {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
        }
        .spots-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .category-chips {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .chip {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .chip:hover {
          color: var(--text-primary);
        }
        .chip.active {
          background: rgba(6, 182, 212, 0.18);
          border-color: var(--cyan);
          color: #ffffff;
        }

        .spots-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 280px;
          overflow-y: auto;
        }
        .spot-item-card {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          transition: all 0.2s;
        }
        .spot-item-card:hover {
          background: rgba(30, 41, 59, 0.8);
          border-color: rgba(6, 182, 212, 0.3);
        }
        .spot-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .spot-name-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .spot-traffic-dot {
          font-size: 0.8rem;
        }
        .spot-name {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .spot-traffic-label {
          font-size: 0.7rem;
          font-weight: 700;
        }
        .spot-wait-tag {
          font-size: 0.72rem;
          font-weight: 700;
        }

        .bookmark-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.15s;
        }
        .bookmark-btn:hover {
          color: var(--cyan);
        }
        .bookmark-btn.saved {
          color: var(--cyan);
        }

        .spot-advice {
          font-size: 0.76rem;
          color: var(--text-secondary);
          line-height: 1.35;
          margin-bottom: 8px;
        }
        .spot-footer {
          display: flex;
          justify-content: flex-end;
        }
        .spot-route-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: var(--cyan);
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .spot-route-btn:hover {
          background: var(--cyan);
          color: #090d16;
        }
      `}</style>
    </div>
  );
}
