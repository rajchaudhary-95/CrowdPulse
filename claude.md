# Project Constitution - HackCelestial4 (CrowdPulse / OmniVenue)

## Project State: SYSTEM DEPLOYED & OPERATIONAL 🚀
**Current Phase:** All B.L.A.S.T. Phases Complete (100% Verified)

---

## 1. North Star & Personas
* **Core Problem:** Mega-event silos cause simultaneous overcrowding in critical zones while adjacent venues and transit capacity sit idle.
* **Mission:** Live unified view of capacity vs demand across venues, transit, and hospitality, paired with early forecasting and automated redistribution recommendations.
* **Stakeholders:**
  1. **Event Organizer / Hospitality Operator:** Command console with live heatmaps, bottleneck alerts, and interactive what-if scenario testing.
  2. **Visitor / Attendee:** Guidance app with best travel windows, less crowded alternate zones, and live route navigation.

---

## 2. Architectural Invariants (MERN Adapted)
1. **Three-Layer Separation:**
   * **Data Layer:** MongoDB schemas + in-memory simulator state engine.
   * **Logic Layer (`/server/services/`):** Pure, deterministic functions for forecasting, LP optimization, and alert evaluation. No UI or ad-hoc LLM reasoning in business logic.
   * **Presentation Layer:** Express REST API + Socket.io feeds consumed by React UI.
2. **Fail-Safe Defaults:** If forecasting or optimization services encounter invalid inputs or error, fall back gracefully to last-known-good state rather than failing the live feed.
3. **Data-First & Schema Validation:** Mongoose schemas validate all persistent documents; REST endpoints validate request payloads at write boundaries.
4. **No Hidden Magic Numbers:** All thresholds, capacities, simulation parameters, and scoring weights live centrally in `/server/config/thresholds.js`.
5. **Zero-Cost External Dependencies:** 100% free-tier architecture (OpenStreetMap, Leaflet.js, OSRM demo routing, in-house JS optimization & forecasting).

---

## 3. Project Directory Layout
```
HackCelestial4/
├── claude.md                    # Project Constitution & State Tracking
├── gemini.md                    # Data Schemas & API/WebSocket Specifications
├── task_plan.md                 # B.L.A.S.T. Phase tracker
├── findings.md                  # Research & Technical Formulations
├── progress.md                  # Change logs & test history
├── server/                      # Backend (Node.js + Express + Socket.io)
│   ├── config/
│   │   ├── db.js                # MongoDB Atlas connection
│   │   └── thresholds.js        # Centralized thresholds & constants
│   ├── models/                  # Mongoose Schemas (Zone, Venue, Edge, Snapshot)
│   ├── services/                # Pure deterministic business logic
│   │   ├── forecasting.service.js
│   │   ├── optimization.service.js
│   │   └── alert.service.js
│   ├── simulator/               # In-memory crowd simulation & tick engine
│   │   ├── crowdSimulator.js
│   │   └── mockData.js          # Realistic zones & event schedules
│   ├── routes/                  # Express REST routes (/api/zones, /api/events, etc.)
│   └── index.js                 # HTTP & Socket.io server entrypoint
├── client/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI components (Heatmap, AlertFeed, WhatIfSlider)
│   │   ├── pages/
│   │   │   ├── OrganizerDashboard.jsx
│   │   │   └── VisitorGuidance.jsx
│   │   ├── services/            # Socket.io client & API fetchers
│   │   └── styles/              # Modern responsive CSS
│   ├── package.json
│   └── vite.config.js
└── .env                         # PORT, MONGO_URI, NODE_ENV
```

---

## 4. Execution Status
* **Phase 1: B - Blueprint:** ✅ Complete
* **Ready for Phase 2: L - Link:** Verify environment credentials, scaffold workspace package structures, build connectivity test handshakes.