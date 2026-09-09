import React, { useState } from 'react';
import { Compass, Flame, Eye, Navigation, MapPin, AlertTriangle, CheckCircle, Footprints, Shield, Sparkles, Sliders } from 'lucide-react';

// Pillai College of Engineering (New Panvel) Authentic Campus Nodes
const CAMPUS_NODES = {
  'zone-panvel-transit': {
    id: 'zone-panvel-transit',
    x: 450,
    y: 55,
    name: 'Panvel Station / Auto Loop',
    shortName: 'Sector 16 Depot',
    icon: '🚖',
  },
  'zone-atrium-main': {
    id: 'zone-atrium-main',
    x: 200,
    y: 190,
    name: 'Engineering Atrium & Gate 1',
    shortName: 'Gate 1 (Main Entry)',
    icon: '🚪',
  },
  'zone-canteen-back': {
    id: 'zone-canteen-back',
    x: 700,
    y: 190,
    name: 'Campus Canteen & Gate 2',
    shortName: 'Gate 2 (Boys Entry)',
    icon: '🍔',
  },
  'zone-quadrangle': {
    id: 'zone-quadrangle',
    x: 450,
    y: 280,
    name: 'The Central Quadrangle',
    shortName: 'The Quadrangle',
    icon: '⚠️',
  },
  'zone-sports-ground': {
    id: 'zone-sports-ground',
    x: 220,
    y: 435,
    name: 'PICA Architecture Lawn',
    shortName: 'PICA Lawn',
    icon: '🌿',
  },
  'zone-main-ground': {
    id: 'zone-main-ground',
    x: 680,
    y: 435,
    name: 'Alegria Main Concert Ground',
    shortName: 'Alegria Main Arena',
    icon: '🎸',
  },
};

// True Campus Walkways & Edges
const CAMPUS_EDGES = [
  { id: 'edge-depot-maingate', from: 'zone-panvel-transit', to: 'zone-atrium-main', label: 'Sector 16 Loop' },
  { id: 'edge-depot-canteengate', from: 'zone-panvel-transit', to: 'zone-canteen-back', label: 'Sector 16 Loop' },
  { id: 'edge-maingate-canteen', from: 'zone-atrium-main', to: 'zone-canteen-back', label: 'Covered Internal Arcade' },
  { id: 'edge-maingate-quad', from: 'zone-atrium-main', to: 'zone-quadrangle', label: 'Atrium Walkway' },
  { id: 'edge-canteengate-quad', from: 'zone-canteen-back', to: 'zone-quadrangle', label: 'Canteen Walkway' },
  { id: 'edge-atrium-sports', from: 'zone-atrium-main', to: 'zone-sports-ground', label: 'PICA Architecture Ramp (Step-Free)' },
  { id: 'edge-canteen-sports', from: 'zone-canteen-back', to: 'zone-sports-ground', label: 'Turf Connector' },
  { id: 'edge-quad-mainground', from: 'zone-quadrangle', to: 'zone-main-ground', label: 'Main Stage Walkway (Central Axis)' },
  { id: 'edge-sports-mainground', from: 'zone-sports-ground', to: 'zone-main-ground', label: 'North Lawn Ramp (Free Flow)' },
];

export default function MapView({
  zones = [],
  transitEdges = [],
  venues = [],
  forecast = {},
  selectedZoneId = null,
  onSelectZone = () => {},
  isVisitorView = false,
  routeData = null,
  originZone = 'zone-atrium-main',
  destZone = 'zone-main-ground',
  selectedRouteType = 'recommended',
  onSelectRouteType = () => {},
  onSelectOrigin = () => {},
  onSelectDest = () => {},
  festivalPhase = {},
  gateStatuses = [],
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [rampsOnly, setRampsOnly] = useState(false);
  const [activePopupNode, setActivePopupNode] = useState(null);

  const isEgress = festivalPhase?.phase === 'EGRESS';
  const isIngress = festivalPhase?.phase === 'INGRESS';

  // If visitor view, render the clean, uncluttered Light & Pastel Navigation Map
  if (isVisitorView) {
    const recommendedNodes = routeData?.recommendedRoute?.pathNodes || [originZone, destZone];
    const standardNodes = routeData?.standardRoute?.pathNodes || [];

    // Helper: Build SVG path string from an array of zone IDs
    const buildPathD = (nodeIds) => {
      if (!nodeIds || nodeIds.length < 2) return '';
      const points = nodeIds.map((id) => CAMPUS_NODES[id] || { x: 450, y: 250 });
      return points.reduce((acc, pt, idx) => {
        if (idx === 0) return `M ${pt.x} ${pt.y}`;
        return `${acc} L ${pt.x} ${pt.y}`;
      }, '');
    };

    const recommendedPathD = buildPathD(recommendedNodes);
    const standardPathD = buildPathD(standardNodes);

    const originNode = CAMPUS_NODES[originZone] || { shortName: originZone };
    const destNode = CAMPUS_NODES[destZone] || { shortName: destZone };

    return (
      <div className="campus-clean-map-card">
        {/* Dynamic Operational Phase & Gate Direction Ribbon */}
        <div className={`map-phase-ribbon font-mono ${isEgress ? 'egress-phase' : isIngress ? 'ingress-phase' : 'circulation-phase'}`}>
          <div className="phase-ribbon-left">
            <span className={`phase-dot-indicator ${isEgress ? 'dot-cyan' : isIngress ? 'dot-green' : 'dot-amber'}`}></span>
            <span className="phase-title-bold">
              {festivalPhase?.phaseIcon || (isEgress ? '🌙' : isIngress ? '🌅' : '☀️')}{' '}
              {festivalPhase?.phaseLabel || (isEgress ? 'Night Egress & Mass Exit' : isIngress ? 'Daytime Ingress Rush' : 'Peak Concurrency')}
            </span>
            <span className="phase-sep-slash">/</span>
            <span className="phase-flow-label">
              {isEgress ? 'Outflow Active (Gates ➔ Station)' : isIngress ? 'Inflow Active (Station ➔ Gates)' : 'Circulation (Bidirectional)'}
            </span>
          </div>
          <div className="phase-ribbon-right">
            <span className="phase-gate-badge">
              {isEgress ? '↑ GATES 1 & 2: REVERSE OUTFLOW' : isIngress ? '↓ GATES 1 & 2: ENTRY ONLY' : '⇅ GATES: BIDIRECTIONAL'}
            </span>
          </div>
        </div>

        {/* Simple & Clean Header */}
        <div className="map-clean-header">
          <div className="map-title-wrap">
            <h3 className="map-clean-title font-display">Campus Navigation Map</h3>
            <span className="map-clean-subtitle font-mono">
              <strong>{originNode.shortName}</strong> &rarr; <strong>{destNode.shortName}</strong>
            </span>
          </div>

          {/* Route Switcher Pills */}
          <div className="map-route-pills font-mono">
            <button
              type="button"
              className={`route-pill-btn ${selectedRouteType === 'recommended' ? 'active-rec' : ''}`}
              onClick={() => onSelectRouteType('recommended')}
            >
              <span>🌿 Recommended</span>
              {routeData?.recommendedRoute?.totalMinutes && (
                <span className="pill-min">({routeData.recommendedRoute.totalMinutes}m)</span>
              )}
            </button>
            {routeData?.standardRoute && (
              <button
                type="button"
                className={`route-pill-btn ${selectedRouteType === 'standard' ? 'active-std' : ''}`}
                onClick={() => onSelectRouteType('standard')}
              >
                <span>🚶 Direct</span>
                <span className="pill-min">({routeData.standardRoute.totalMinutes}m)</span>
              </button>
            )}
          </div>
        </div>

        {/* Campus Map SVG Canvas */}
        <div className="map-canvas-container">
          <svg
            className="wayfinding-svg"
            viewBox="0 0 900 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Subtle architectural dot grid */}
              <pattern id="clean-campus-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="1" fill="#cbd5e1" opacity="0.6" />
              </pattern>

              {/* Glowing Route Gradient (Path 1 Recommended) */}
              <linearGradient id="recommended-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              {/* Glowing Route Gradient (Path 2 Direct Concourse) */}
              <linearGradient id="standard-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            {/* Canvas Base Grid */}
            <rect width="100%" height="100%" fill="#f8fafc" />
            <rect width="100%" height="100%" fill="url(#clean-campus-dots)" />

            {/* Campus Boundary Outline */}
            <rect
              x="50"
              y="20"
              width="800"
              height="440"
              rx="16"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text x="70" y="42" fill="#94a3b8" fontSize="10" fontFamily="Geist Mono" fontWeight="600" letterSpacing="0.06em">
              CAMPUS GROUNDS &bull; NEW PANVEL
            </text>

            {/* 1. Base Campus Walkway Connectors */}
            {CAMPUS_EDGES.map((edge) => {
              const from = CAMPUS_NODES[edge.from];
              const to = CAMPUS_NODES[edge.to];
              if (!from || !to) return null;

              return (
                <line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              );
            })}

            {/* 2. Render Inactive Route (Soft Dashed Line) */}
            {selectedRouteType === 'standard' && recommendedPathD && recommendedPathD !== standardPathD && (
              <g style={{ cursor: 'pointer' }} onClick={() => onSelectRouteType('recommended')}>
                <path
                  d={recommendedPathD}
                  stroke="#94a3b8"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              </g>
            )}
            {selectedRouteType === 'recommended' && standardPathD && standardPathD !== recommendedPathD && (
              <g style={{ cursor: 'pointer' }} onClick={() => onSelectRouteType('standard')}>
                <path
                  d={standardPathD}
                  stroke="#fcd34d"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </g>
            )}

            {/* 3. Render Active Route with Flow Glow */}
            {selectedRouteType === 'standard' && standardPathD && (
              <g>
                <path
                  d={standardPathD}
                  stroke="rgba(245, 158, 11, 0.2)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={standardPathD}
                  stroke="url(#standard-grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={standardPathD}
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6 10"
                  strokeLinecap="round"
                  className="animated-flow-dash"
                />
              </g>
            )}

            {selectedRouteType === 'recommended' && recommendedPathD && (
              <g>
                <path
                  d={recommendedPathD}
                  stroke="rgba(14, 165, 233, 0.18)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={recommendedPathD}
                  stroke="url(#recommended-grad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={recommendedPathD}
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="6 10"
                  strokeLinecap="round"
                  className="animated-flow-dash"
                />
              </g>
            )}

            {/* 4. Central Quad Concourse (Simple, Clean Busy Warning) */}
            <g transform="translate(450, 280)">
              <rect
                x="-80"
                y="-14"
                width="160"
                height="28"
                rx="14"
                fill="#fffbeb"
                stroke="#fde68a"
                strokeWidth="1.5"
                filter="drop-shadow(0 2px 4px rgba(245, 158, 11, 0.1))"
              />
              <text x="0" y="4" fill="#b45309" fontSize="10" fontFamily="Plus Jakarta Sans" fontWeight="700" textAnchor="middle">
                ⚠️ Central Quad (Busy)
              </text>
            </g>

            {/* 5. Minimalist Campus Location Badges */}
            {Object.values(CAMPUS_NODES).map((node) => {
              if (node.id === 'zone-quadrangle') return null;

              const isOrigin = node.id === originZone;
              const isDest = node.id === destZone;
              const isRecommendedHop = recommendedNodes.includes(node.id);

              const pillWidth = isOrigin ? 150 : isDest ? 150 : 130;
              const pillHeight = 32;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="campus-clean-node"
                  onClick={() => setActivePopupNode(node)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer subtle pulse glow for Origin and Dest */}
                  {isOrigin && (
                    <circle cx="0" cy="0" r="28" fill="rgba(2, 132, 199, 0.15)" className="pulse-ring" />
                  )}
                  {isDest && (
                    <circle cx="0" cy="0" r="28" fill="rgba(16, 185, 129, 0.18)" className="pulse-ring" />
                  )}

                  {/* Clean Pill Shape */}
                  <rect
                    x={-pillWidth / 2}
                    y={-pillHeight / 2}
                    width={pillWidth}
                    height={pillHeight}
                    rx={pillHeight / 2}
                    fill={
                      isOrigin
                        ? '#0284c7'
                        : isDest
                        ? '#059669'
                        : isRecommendedHop
                        ? '#f0f9ff'
                        : '#ffffff'
                    }
                    stroke={
                      isOrigin
                        ? '#0369a1'
                        : isDest
                        ? '#047857'
                        : isRecommendedHop
                        ? '#38bdf8'
                        : '#e2e8f0'
                    }
                    strokeWidth={isOrigin || isDest ? 1.5 : 1.5}
                    filter="drop-shadow(0 2px 6px rgba(15, 23, 42, 0.08))"
                  />

                  {/* Clean Node Text */}
                  <text
                    x="0"
                    y="4"
                    fill={isOrigin || isDest ? '#ffffff' : isRecommendedHop ? '#0369a1' : '#1e293b'}
                    fontSize="10.5"
                    fontFamily="Plus Jakarta Sans"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {isOrigin
                      ? `🚩 ${node.shortName}`
                      : isDest
                      ? `🎯 ${node.shortName}`
                      : `${node.icon} ${node.shortName}`}
                  </text>
                </g>
              );
            })}

            {/* 6. Dynamic Festival Gate Flow & Direction Badges */}
            {/* Gate 1 Direction Tag */}
            <g transform="translate(200, 146)">
              <rect
                x="-78"
                y="-13"
                width="156"
                height="24"
                rx="12"
                fill={isEgress ? '#ecfdf5' : '#eff6ff'}
                stroke={isEgress ? '#10b981' : '#38bdf8'}
                strokeWidth="1.5"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
              />
              <text x="0" y="4" fill={isEgress ? '#047857' : '#0284c7'} fontSize="9" fontFamily="Plus Jakarta Sans" fontWeight="800" textAnchor="middle">
                {isEgress ? '↑ EXIT SURGE (340 p/m)' : '↓ ENTRY ONLY (Ticket Scan)'}
              </text>
            </g>

            {/* Gate 2 Direction Tag */}
            <g transform="translate(700, 146)">
              <rect
                x="-78"
                y="-13"
                width="156"
                height="24"
                rx="12"
                fill={isEgress ? '#ecfdf5' : '#eff6ff'}
                stroke={isEgress ? '#10b981' : '#38bdf8'}
                strokeWidth="1.5"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
              />
              <text x="0" y="4" fill={isEgress ? '#047857' : '#0284c7'} fontSize="9" fontFamily="Plus Jakarta Sans" fontWeight="800" textAnchor="middle">
                {isEgress ? '↑ RAPID EXIT (To Trains)' : '↓ ENTRY ONLY (Boys Check)'}
              </text>
            </g>

            {/* Gate 3 Emergency Relief Tag (in Egress) */}
            {isEgress && (
              <g transform="translate(220, 482)">
                <rect
                  x="-82"
                  y="-12"
                  width="164"
                  height="22"
                  rx="11"
                  fill="#fffbeb"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  filter="drop-shadow(0 2px 4px rgba(245, 158, 11, 0.15))"
                />
                <text x="0" y="3" fill="#b45309" fontSize="8.5" fontFamily="Plus Jakarta Sans" fontWeight="800" textAnchor="middle">
                  ⚡ GATE 3 RELIEF OPEN (160 p/m)
                </text>
              </g>
            )}
          </svg>

          {/* Quick Node Selector Modal on Click */}
          {activePopupNode && (
            <div
              className="clean-map-modal font-mono"
              style={{
                top: Math.min(270, activePopupNode.y - 45),
                left: Math.min(650, Math.max(70, activePopupNode.x - 100)),
              }}
            >
              <div className="modal-title-row">
                <span className="font-bold text-dark">{activePopupNode.name}</span>
                <button className="btn-close-modal" onClick={() => setActivePopupNode(null)}>✕</button>
              </div>
              <div className="modal-btns-row">
                <button
                  className="btn-loc-set origin"
                  onClick={() => {
                    onSelectOrigin(activePopupNode.id);
                    setActivePopupNode(null);
                  }}
                >
                  🚩 Set as Start
                </button>
                <button
                  className="btn-loc-set dest"
                  onClick={() => {
                    onSelectDest(activePopupNode.id);
                    setActivePopupNode(null);
                  }}
                >
                  🎯 Set as Destination
                </button>
              </div>
            </div>
          )}

          {/* Minimalist 2-Item Legend */}
          <div className="clean-legend font-mono">
            <div
              className={`legend-pill ${selectedRouteType === 'recommended' ? 'active' : ''}`}
              onClick={() => onSelectRouteType('recommended')}
            >
              <span className="legend-dot rec"></span>
              <span>Recommended Path</span>
            </div>
            <div
              className={`legend-pill ${selectedRouteType === 'standard' ? 'active' : ''}`}
              onClick={() => onSelectRouteType('standard')}
            >
              <span className="legend-dot std"></span>
              <span>Direct Path</span>
            </div>
          </div>
        </div>

        <style>{`
          .campus-clean-map-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px -2px rgba(100, 116, 139, 0.08);
            margin-top: 1rem;
          }

          /* Dynamic Operational Phase Ribbon */
          .map-phase-ribbon {
            padding: 8px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(226, 232, 240, 0.8);
            font-size: 0.68rem;
            transition: all 0.2s ease;
          }
          .map-phase-ribbon.ingress-phase {
            background: #f0fdf4;
            color: #166534;
            border-bottom-color: #bbf7d0;
          }
          .map-phase-ribbon.egress-phase {
            background: #f0f9ff;
            color: #0369a1;
            border-bottom-color: #bae6fd;
          }
          .map-phase-ribbon.circulation-phase {
            background: #fffbeb;
            color: #92400e;
            border-bottom-color: #fde68a;
          }
          .phase-ribbon-left {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .phase-dot-indicator {
            width: 7px;
            height: 7px;
            border-radius: 50%;
          }
          .dot-green { background: #16a34a; box-shadow: 0 0 6px #22c55e; }
          .dot-cyan { background: #0284c7; box-shadow: 0 0 6px #38bdf8; }
          .dot-amber { background: #d97706; box-shadow: 0 0 6px #f59e0b; }
          .phase-title-bold {
            font-weight: 800;
            letter-spacing: 0.04em;
          }
          .phase-sep-slash {
            color: #cbd5e1;
          }
          .phase-flow-label {
            font-weight: 600;
          }
          .phase-gate-badge {
            background: rgba(255, 255, 255, 0.9);
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 800;
            font-size: 0.64rem;
            letter-spacing: 0.04em;
            border: 1px solid currentColor;
          }

          .map-clean-header {
            padding: 14px 20px;
            background: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }
          .map-clean-title {
            font-size: 1.05rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
          }
          .map-clean-subtitle {
            font-size: 0.72rem;
            color: #64748b;
          }
          .map-clean-subtitle strong {
            color: #0f172a;
          }
          .map-route-pills {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .route-pill-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.72rem;
            font-weight: 700;
            color: #475569;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .route-pill-btn:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
            color: #0f172a;
          }
          .route-pill-btn.active-rec {
            background: #ecfdf5;
            border-color: #a7f3d0;
            color: #047857;
          }
          .route-pill-btn.active-std {
            background: #fffbeb;
            border-color: #fde68a;
            color: #b45309;
          }
          .pill-min {
            font-weight: 800;
            opacity: 0.9;
          }

          .map-canvas-container {
            height: 450px;
            position: relative;
            background: #f8fafc;
            overflow: hidden;
          }
          .wayfinding-svg {
            width: 100%;
            height: 100%;
          }
          .animated-flow-dash {
            animation: dashFlow 1.2s linear infinite;
          }
          @keyframes dashFlow {
            from { stroke-dashoffset: 32; }
            to { stroke-dashoffset: 0; }
          }
          .pulse-ring {
            animation: pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          }
          @keyframes pulseRing {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 0.15; }
            100% { transform: scale(0.9); opacity: 0.8; }
          }
          .campus-clean-node:hover rect {
            transform: scale(1.04);
            transition: transform 0.15s ease;
          }

          .clean-map-modal {
            position: absolute;
            z-index: 25;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
            width: 210px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          }
          .modal-title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.76rem;
            margin-bottom: 8px;
          }
          .btn-close-modal {
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 0.8rem;
          }
          .btn-close-modal:hover {
            color: #0f172a;
          }
          .modal-btns-row {
            display: flex;
            gap: 6px;
          }
          .btn-loc-set {
            flex: 1;
            padding: 5px 6px;
            border-radius: 6px;
            font-size: 0.68rem;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.15s ease;
          }
          .btn-loc-set.origin {
            background: #e0f2fe;
            color: #0369a1;
            border-color: #bae6fd;
          }
          .btn-loc-set.dest {
            background: #ecfdf5;
            color: #047857;
            border-color: #a7f3d0;
          }
          .btn-loc-set:hover {
            filter: brightness(0.96);
          }

          .clean-legend {
            position: absolute;
            bottom: 14px;
            left: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border: 1px solid #e2e8f0;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.68rem;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          }
          .legend-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #64748b;
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 12px;
            transition: color 0.15s ease;
          }
          .legend-pill:hover,
          .legend-pill.active {
            color: #0f172a;
          }
          .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          .legend-dot.rec {
            background: #0ea5e9;
          }
          .legend-dot.std {
            background: #f59e0b;
          }
        `}</style>
      </div>
    );
  }

  // Otherwise, render the Organizer Geospatial Vector Radar from Image 1
  return (
    <div className="radar-panel-organizer glass-panel">
      {/* Dynamic Operational Phase & Gate Telemetry Bar */}
      <div className={`radar-phase-telemetry-bar font-mono ${isEgress ? 'telemetry-egress' : isIngress ? 'telemetry-ingress' : 'telemetry-circulation'}`}>
        <div className="telemetry-bar-left">
          <span className="telemetry-phase-pill">
            {festivalPhase?.phaseIcon || (isEgress ? '🌙' : isIngress ? '🌅' : '☀️')}{' '}
            {festivalPhase?.phaseLabel || (isEgress ? 'NIGHT EGRESS / MASS EXIT' : isIngress ? 'DAYTIME INGRESS RUSH' : 'PEAK CONCURRENCY')}
          </span>
          <span className="telemetry-flow-info">
            GATE MODE: <strong>{isEgress ? 'REVERSE EGRESS (94% OUTFLOW)' : isIngress ? 'ENTRY TURNSTILES (88% INFLOW)' : 'BIDIRECTIONAL FLOW'}</strong>
          </span>
        </div>
        <div className="telemetry-bar-right">
          <span className="gate-flow-mini">G1: {isEgress ? '↑ 340 Out/m' : '↓ 230 In/m'}</span>
          <span className="gate-flow-mini">G2: {isEgress ? '↑ 295 Out/m' : '↓ 195 In/m'}</span>
          {isEgress && <span className="gate-flow-mini text-warning">G3: ⚡ 160 Out/m</span>}
        </div>
      </div>

      {/* Top HUD Controls Bar */}
      <div className="radar-top-hud">
        <div className="radar-tag font-mono">
          <span className="pulse-dot-cyan"></span>
          <span>GEOSPATIAL VECTOR RADAR ●</span>
        </div>

        <div className="radar-hud-tools font-mono">
          <button
            className={`hud-btn ${showVectors ? 'active' : ''}`}
            onClick={() => setShowVectors(!showVectors)}
          >
            VECTORS: {showVectors ? 'ON' : 'OFF'}
          </button>
          <button
            className={`hud-btn ${showHeatmap ? 'active' : ''}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            HEATMAP
          </button>
          <div className="hud-divider"></div>
          <button
            className="hud-zoom-btn"
            onClick={() => setZoomLevel((prev) => Math.min(1.4, prev + 0.15))}
          >
            +
          </button>
          <button
            className="hud-zoom-btn"
            onClick={() => setZoomLevel((prev) => Math.max(0.7, prev - 0.15))}
          >
            -
          </button>
        </div>
      </div>

      {/* Main Vector Radar Canvas */}
      <div className="organizer-canvas-container">
        {showHeatmap && (
          <>
            <div className="heat-glow red-heat-glow" />
            <div className="heat-glow cyan-heat-glow" />
          </>
        )}

        <svg
          className="organizer-radar-svg"
          viewBox="0 0 800 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Concentric Radar Rings */}
          <circle cx="400" cy="300" r="240" stroke="rgba(148, 163, 184, 0.22)" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="400" cy="300" r="180" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="20" opacity="0.6" />
          <circle cx="400" cy="300" r="120" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />
          <circle cx="400" cy="300" r="50" stroke="rgba(99, 102, 241, 0.35)" strokeWidth="1" strokeDasharray="2 2" fill="rgba(99, 102, 241, 0.05)" />

          {/* Stadium Structure */}
          <ellipse cx="400" cy="300" rx="140" ry="110" fill="#ffffff" stroke="rgba(203, 213, 225, 0.9)" strokeWidth="2" filter="drop-shadow(0 4px 16px rgba(100, 116, 139, 0.08))" />
          <ellipse cx="400" cy="300" rx="80" ry="55" fill="#ede9fe" stroke="#818cf8" strokeWidth="1.5" />

          {/* Crosshairs Lines */}
          <line x1="400" y1="50" x2="400" y2="550" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="150" y1="300" x2="650" y2="300" stroke="rgba(148, 163, 184, 0.18)" strokeWidth="1" strokeDasharray="2 2" />

          {/* Vector Corridors */}
          {showVectors && (
            <>
              {/* Corridor North: Critical Flow */}
              <path
                d={isEgress ? "M 400 150 L 400 40" : "M 400 40 L 400 150"}
                stroke="#e11d48"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray="8 6"
                className="pulse-anim-corridor"
              />
              <text x="415" y="80" fill="#e11d48" fontSize="11" fontFamily="Geist Mono" fontWeight="700">
                {isEgress ? 'CENTRAL AXIS ➔ PANVEL TRANSIT (EGRESS SURGE)' : 'THE QUAD ⇄ MAIN ARENA (92% CHOKE)'}
              </text>

              {/* Corridor East: Gate 1 */}
              <path d={isEgress ? "M 550 300 L 660 300" : "M 660 300 L 550 300"} stroke="#0284c7" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" />
              <text x="545" y="285" fill="#0284c7" fontSize="11" fontFamily="Geist Mono" fontWeight="700">
                {isEgress ? 'GATE 1: REVERSED TURNSTILES (340 p/m OUT)' : 'GATE 1: GIRLS/VIP INGRESS FEEDER (230 p/m)'}
              </text>

              {/* Corridor South: Gate 3 / Bypass */}
              <path d={isEgress ? "M 400 440 L 400 550" : "M 400 550 L 400 440"} stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" />
              <text x="415" y="520" fill="#6366f1" fontSize="11" fontFamily="Geist Mono" fontWeight="600">
                {isEgress ? 'GATE 3 RELIEF EXIT VALVE (DISPERSAL ACTIVE)' : 'CANTEEN ⇄ SPORTS GROUND BYPASS'}
              </text>

              {/* Corridor West: Gate 2 */}
              <path d={isEgress ? "M 250 300 L 130 300" : "M 130 300 L 250 300"} stroke="#d97706" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 4" />
              <text x="135" y="285" fill="#d97706" fontSize="11" fontFamily="Geist Mono" fontWeight="700">
                {isEgress ? 'GATE 2: DIRECT PANVEL STATION WALKING EGRESS' : 'GATE 2 BOYS CORRIDOR (INFLOW SCANNING)'}
              </text>
            </>
          )}

          {/* Gate Portals */}
          {/* Main Concert Stage North */}
          <g transform="translate(370, 140)" className="cursor-pointer" onClick={() => onSelectZone('zone-main-ground')}>
            <rect width="60" height="20" rx="4" fill="#e11d48" />
            <text x="6" y="14" fill="#ffffff" fontSize="9" fontFamily="Geist Mono" fontWeight="bold">MAIN STG</text>
          </g>

          {/* Gate 1 Girls / VIP East */}
          <g transform="translate(540, 290)" className="cursor-pointer" onClick={() => onSelectZone('zone-atrium-main')}>
            <rect width="22" height="40" rx="4" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" filter="drop-shadow(0 2px 4px rgba(2, 132, 199, 0.15))" />
            <text x="4" y="24" fill="#0284c7" fontSize="8" fontFamily="Geist Mono" fontWeight="bold">GT 1</text>
          </g>

          {/* The Quad Concourse South */}
          <g transform="translate(370, 410)" className="cursor-pointer" onClick={() => onSelectZone('zone-quadrangle')}>
            <rect width="60" height="20" rx="4" fill="#ffffff" stroke="#6366f1" strokeWidth="1.5" filter="drop-shadow(0 2px 4px rgba(99, 102, 241, 0.15))" />
            <text x="8" y="14" fill="#6366f1" fontSize="9" fontFamily="Geist Mono" fontWeight="bold">THE QUAD</text>
          </g>

          {/* Gate 2 Boys West */}
          <g transform="translate(240, 290)" className="cursor-pointer" onClick={() => onSelectZone('zone-canteen-back')}>
            <rect width="22" height="40" rx="4" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" filter="drop-shadow(0 2px 4px rgba(217, 119, 6, 0.15))" />
            <text x="4" y="24" fill="#d97706" fontSize="8" fontFamily="Geist Mono" fontWeight="bold">GT 2</text>
          </g>

          {/* Animated Particles */}
          <circle cx="400" cy="100" r="3" fill="#ef4444">
            <animate attributeName="cy" from="40" to="150" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="600" cy="300" r="3" fill="#4cd7f6">
            <animate attributeName="cx" from="660" to="550" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="400" cy="480" r="3" fill="#93c5fd">
            <animate attributeName="cy" from="550" to="440" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Live Sector Callout Chips */}
        <div className="sector-callout callout-north font-mono">
          <span className="callout-title">SECTOR 1 (CENTRAL QUAD BOTTLENECK)</span>
          <div className="callout-value">
            <span className="callout-dot bg-error"></span>
            <span className="text-error font-bold">1,850 OCC (92%)</span>
          </div>
        </div>

        <div className="sector-callout callout-south font-mono">
          <span className="callout-title">SECTOR 2 (MAIN CONCERT GROUND)</span>
          <div className="callout-value">
            <span className="callout-dot bg-cyan"></span>
            <span className="text-cyan font-bold">5,850 OCC (84%)</span>
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="organizer-map-legend font-mono">
          <div className="legend-chip">
            <span className="legend-sq bg-optimal"></span>
            <span>Optimal (&lt;60%)</span>
          </div>
          <div className="legend-chip">
            <span className="legend-sq bg-heavy"></span>
            <span>Heavy (60-85%)</span>
          </div>
          <div className="legend-chip">
            <span className="legend-sq bg-choke"></span>
            <span>Choke (&gt;85%)</span>
          </div>
        </div>
      </div>

      <style>{`
        .radar-panel-organizer {
          height: 100%;
          min-height: 580px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: var(--radius-lg);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 12px rgba(100, 116, 139, 0.06);
          transition: all 0.2s ease;
        }
        .radar-panel-organizer:hover {
          box-shadow: 0 6px 20px rgba(100, 116, 139, 0.1);
          border-color: rgba(99, 102, 241, 0.25);
        }

        .radar-top-hud {
          position: absolute;
          top: 14px;
          left: 16px;
          right: 16px;
          z-index: 20;
          display: flex;
          justify-content: space-between;
          align-items: center;
          pointer-events: none;
        }

        .radar-tag {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 0.06em;
          box-shadow: 0 2px 8px rgba(100, 116, 139, 0.06);
        }
        .pulse-dot-cyan {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #0284c7;
          box-shadow: 0 0 6px rgba(2, 132, 199, 0.4);
        }

        .radar-hud-tools {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          padding: 4px 6px;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(100, 116, 139, 0.06);
        }
        .hud-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hud-btn.active {
          background: #e0f2fe;
          color: #0284c7;
        }
        .hud-btn:hover {
          color: #0f172a;
        }
        .hud-divider {
          width: 1px;
          height: 14px;
          background: #e2e8f0;
        }
        .hud-zoom-btn {
          width: 22px;
          height: 22px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .organizer-canvas-container {
          flex: 1;
          background: #f8fafc;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .organizer-radar-svg {
          width: 90%;
          height: 90%;
          transition: transform 0.4s ease;
        }

        .heat-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(50px);
          pointer-events: none;
        }
        .red-heat-glow {
          width: 200px;
          height: 200px;
          background: rgba(225, 29, 72, 0.12);
          top: 30px;
          left: 42%;
        }
        .cyan-heat-glow {
          width: 220px;
          height: 220px;
          background: rgba(14, 165, 233, 0.1);
          bottom: 40px;
          right: 30%;
        }

        .sector-callout {
          position: absolute;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          pointer-events: none;
          box-shadow: 0 4px 12px rgba(100, 116, 139, 0.08);
        }
        .callout-north {
          top: 70px;
          left: 40px;
        }
        .callout-south {
          bottom: 70px;
          right: 40px;
        }
        .callout-title {
          font-size: 0.62rem;
          color: #64748b;
          font-weight: 700;
        }
        .callout-value {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
        }
        .callout-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .bg-error { background: #e11d48; }
        .bg-cyan { background: #0284c7; }

        .organizer-map-legend {
          position: absolute;
          bottom: 14px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.85);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.68rem;
          color: #475569;
          box-shadow: 0 2px 8px rgba(100, 116, 139, 0.08);
        }
        .legend-chip {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .legend-sq {
          width: 7px;
          height: 7px;
          border-radius: 2px;
        }
        .bg-optimal { background: #059669; }
        .bg-heavy { background: #b45309; }
        .bg-choke { background: #e11d48; }

        .text-error { color: #e11d48; }
        .text-cyan { color: #0284c7; }

        /* Dynamic Operational Phase & Gate Telemetry Bar */
        .radar-phase-telemetry-bar {
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          font-size: 0.68rem;
          transition: all 0.2s ease;
        }
        .radar-phase-telemetry-bar.telemetry-ingress {
          background: #f0fdf4;
          color: #166534;
          border-bottom-color: #bbf7d0;
        }
        .radar-phase-telemetry-bar.telemetry-egress {
          background: #f0f9ff;
          color: #0369a1;
          border-bottom-color: #bae6fd;
        }
        .radar-phase-telemetry-bar.telemetry-circulation {
          background: #fffbeb;
          color: #92400e;
          border-bottom-color: #fde68a;
        }
        .telemetry-bar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .telemetry-phase-pill {
          background: rgba(255, 255, 255, 0.95);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
          letter-spacing: 0.04em;
          border: 1px solid currentColor;
        }
        .telemetry-flow-info {
          font-weight: 600;
        }
        .telemetry-bar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gate-flow-mini {
          background: rgba(255, 255, 255, 0.9);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.62rem;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }
      `}</style>
    </div>
  );
}
