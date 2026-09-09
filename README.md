# 🎪 CrowdPulse — Pillai University's Alegria Festival Intelligence Platform

> **Real-Time Mega-Event Crowd, Transit & Venue Orchestration Platform**

CrowdPulse (OmniVenue) is an operational platform designed for stadiums, festivals, and mega-events. It bridges the gap between event organizers, transit operators, and attendees by maintaining a single, real-time operational picture powered by deterministic forecasting and Linear Programming (LP) flow optimization.

The platform provides a high-density **Organizer Command Center** for event operations and incident response, paired with a simple, traffic-light **Visitor Companion** for attendees.

---

## 🏛️ System Architecture

```
+-------------------------------------------------------------------------+
|                           PRESENTATION LAYER                            |
|             React 18 (Vite) • Leaflet Maps • Dark Glassmorphism         |
|      /organizer (Command Console)       |     /visitor (Companion)      |
+------------------------------------+------------------------------------+
                                     ▲
                     (WebSocket / HTTP REST / Bearer JWT)
                                     ▼
+-------------------------------------------------------------------------+
|                        LOGIC & ENGINE LAYER                             |
|  • Forecasting Engine (Holt's Linear Smoothing + Event Schedule Surges) |
|  • Optimization Engine (In-house Simplex Linear Programming Solver)     |
|  • Alert & Playbook Evaluator (Continuous threshold & breach triage)    |
|  • Real-Time Dispatcher (Socket.io broadcasting 5-second ticks)         |
+------------------------------------+------------------------------------+
                                     ▲
                                     ▼
+-------------------------------------------------------------------------+
|                     DATA & AUTHENTICATION LAYER                         |
|  • Supabase PostgreSQL (Profiles, Zones, Venues, Edges, Snapshots)      |
|  • Supabase Auth & RBAC (Real Email/Password, JWT Verification)         |
|  • Row Level Security (RLS) & Automated Profile Trigger                 |
|  • Fail-Safe Fallback: Local MongoDB & High-Performance In-Memory Cache |
|  • Geospatial Endpoints: OpenStreetMap Tiles & OSRM Routing             |
+-------------------------------------------------------------------------+
```

---

## 🚀 Key Features

### 1. Organizer Command Center (`/organizer`)
Designed for event operations directors, transport coordinators, and incident commanders:

- **Multi-Layer Geospatial Map**:
  - **Heatmap Overlay**: Continuous density gradient contours visualizing crowd pressure hot spots.
  - **Transit Vectors**: Directional polylines color-coded by congestion level (optimal, moderate, heavy, gridlock).
  - **Emergency Corridors**: Dedicated evacuation and rapid medical egress pathways.
  - **Venue Perimeters**: Interactive boundaries displaying real-time occupancy and 60-minute forward forecasts.
- **Incident Response Playbooks**: Alert cards feature 1-click tactical interventions:
  - `[⚡ Auto-Reroute]`: Dispatches the Simplex LP solver to rebalance flow across alternate transit corridors.
  - `[📢 Push Advisory]`: Broadcasts delay notifications to attendee mobile companion feeds.
  - `[👮 Dispatch Stewards]`: Logs marshal deployment with chronological timestamps.
  - `[✅ Resolve]`: Clears resolved alerts.
- **Live Operations Audit Trail**: A scrolling chronological record of all interventions taken by operations staff.
- **Simplex LP Solver Visualizer**: Displays calculated congestion reductions (e.g. `-18% congestion`) and total rerouted attendees, with 1-click **Apply Solver Actions** execution.
- **Perimeter Telemetry Matrix**: A live, sortable table monitoring all 5 zones with current occupancy %, capacity limits, transit pressure bars, composite stress scores (0–100), and 1-click map focus.
- **What-If Simulation Drawer**: Interactive sliders allowing operators to test demand surges (1.0x–2.0x), offset event end times, or adjust transit edge capacities in real time.
- **Zen / Fullscreen Mode**: Press `F` or click **Zen Mode** to maximize the map and metrics for command center projectors and multi-monitor setups.

### 2. Intuitive Visitor Companion (`/visitor`)
Designed for event attendees to navigate friction-free:

- **Visual Traffic-Light Status**: Replaces raw numbers and percentages with clear status chips:
  - 🟢 **Smooth & Clear**: Open walkways, no wait times at turnstiles.
  - 🟡 **Moderate Flow**: Steady movement with short checkpoint delays (4–7 mins).
  - 🔴 **Heavy Congestion**: Packed concourses and long lines (15–20 mins); delay recommended.
- **1-Tap Route Finder**: Select your start and destination venues to see:
  - **Direct Route**: Standard concourse path with crowd rating.
  - **🌿 Crowd-Free Path (Recommended)**: Low-stress alternate walkway showing walking time and minutes saved.
- **"Best Time to Move" Advisory**: A visual timeline showing the optimal travel window before stadium egress surges begin.
- **"Skip the Queues" Categories**: 1-tap category chips to discover calm spots:
  - 🍔 **Food**: Stalls with short queue times.
  - 🌳 **Chill Spots**: Shaded resting lawns and low-density gardens.
  - 📺 **Big Screens**: Festival viewing plazas broadcasting live stadium feeds.
- **Event Bookmarks**: 1-click save functionality to keep track of ticketed venues.

### 3. Authentication & Role-Based Access Control (RBAC)
- **Supabase Auth Integration**: Full email and password registration and login via `@supabase/supabase-js`.
- **Role Clearances**:
  - `organizer`: Full access to the Organizer Command Center, simulation levers, and incident playbooks.
  - `visitor`: Attendee navigation portal; restricted from operational controls.
  - `admin`: Superuser clearance.
- **Server-Side Security**: Protected mutation endpoints (`/scenario`, `/control/clock`, `/seed`, `/alerts/:id/action`) verify Supabase JWT Bearer tokens and enforce role clearance.
- **User Profile Menu**: Dropdown in the navigation bar displaying user initials, role tag, and sign-out controls.
- **Fail-Safe Operation**: If cloud credentials are not supplied, the platform seamlessly runs in local fallback mode without crashing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Leaflet, React-Leaflet, Lucide React, Socket.io-client, Supabase JS, Vanilla CSS (Dark Glassmorphism) |
| **Backend** | Node.js, Express, Socket.io, JavaScript Simplex LP Solver (`javascript-lp-solver`), Supabase JS, Mongoose |
| **Database** | Supabase PostgreSQL (Cloud) with Row Level Security (RLS) + Local MongoDB Fallback |
| **Geospatial & Routing** | OpenStreetMap (OSM) Tiles, Open Source Routing Machine (OSRM) |

---

## 📦 Project Structure

```
HackCelestial4/
├── client/                     # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/        # MapView, AlertsFeed, OptimizationPanel, Navbar, AuthModal, etc.
│   │   ├── context/           # AuthContext (Supabase Auth & Session Management)
│   │   ├── pages/             # OrganizerDashboard & VisitorGuidance
│   │   ├── services/          # Supabase client, Socket.io client, REST API client
│   │   ├── App.jsx            # Application root with role routing
│   │   └── index.css          # Design system tokens & dark glassmorphism styles
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express Backend Engine
│   ├── config/                # Database configurations (Supabase, MongoDB, Thresholds)
│   ├── middleware/            # JWT verification & role authorization middleware
│   ├── models/                # Mongoose models (Zone, Venue, TransitEdge, Alert, Snapshot)
│   ├── routes/                # REST API routes (State, Forecast, Scenarios, Playbooks)
│   ├── services/              # Pure services (Forecasting, Simplex LP Solver, Alert rules)
│   ├── simulator/             # Crowd & transit simulation daemon & seed datasets
│   ├── index.js               # Express & Socket.io server entry point
│   ├── package.json
│   └── test-*.js              # Test suites (handshake, pure services, integration)
├── supabase/
│   └── schema.sql             # Complete PostgreSQL schema, RLS policies, and seed data
├── .env.example               # Environment variables template
├── package.json               # Unified workspace scripts
└── README.md
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development

# Database Provider ('supabase' or 'mongodb')
DB_PROVIDER=supabase

# Supabase Credentials (from Supabase -> Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# Vite Frontend Supabase Keys (used by React client)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Fallback Database (used if DB_PROVIDER=mongodb or offline)
MONGODB_URI=mongodb://127.0.0.1:27017/crowdpulse

# Real-Time Heartbeat Interval (milliseconds)
TICK_INTERVAL_MS=5000
SIMULATION_SPEED=1

# External Free-Tier Public Routing Endpoints
OSRM_BASE_URL=http://router.project-osrm.org/route/v1/driving
OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 🗄️ Supabase Database Setup

1. Create a free project on [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Open [`supabase/schema.sql`](supabase/schema.sql), copy its contents, paste them into the SQL Editor, and click **Run**.
4. Copy your project URL, anon key, and service role key into your `.env` file.

The schema automatically initializes:
- `profiles` table with automatic triggers on `auth.users` signup.
- `zones`, `venues`, and `transit_edges` tables.
- `alerts` and `audit_logs` tables.
- `visitor_flow_snapshots` table for historical time series.
- Row Level Security (RLS) policies.
- 5 default Olympic Complex zones, venues, and transit corridors.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Install server dependencies
npm --prefix server install

# Install client dependencies
npm --prefix client install
```

### 2. Run the Verification Suite
```bash
npm test
```
This executes:
1. **Handshake Test**: Verifies `.env`, database reachability, LP solver feasibility, and map tile endpoints.
2. **Pure Services Unit Tests**: Validates Holt's linear forecasting, Simplex crowd redistribution, and alert evaluation.
3. **Integration Test**: Boots an in-memory server instance, validates REST endpoints, and verifies RBAC access restrictions.

### 3. Start the Application
Run both processes in separate terminal windows:

```bash
# Terminal 1: Backend Server & Simulation Daemon
npm run dev:server

# Terminal 2: Frontend React Application
npm run dev:client
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API & WebSocket**: `http://localhost:5000`

---

## 📡 REST API Reference

| Method | Endpoint | Clearance | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | Public | System status, simulated clock time, connected zone/venue counts |
| `GET` | `/api/state` | Public | Full snapshot payload (zones, edges, forecast, alerts, recommendations) |
| `GET` | `/api/zones` | Public | List all perimeter zones and live metrics |
| `GET` | `/api/venues` | Public | List all venues and scheduled events |
| `GET` | `/api/transit` | Public | List all transit edges, flows, and congestion indices |
| `GET` | `/api/forecast` | Public | 60-minute forward crowd pressure projection |
| `GET` | `/api/alerts` | Public | Current active breaches and warnings |
| `GET` | `/api/recommendations` | Public | Current LP solver redistribution actions |
| `GET` | `/api/visitor/route` | Public | Calculate crowd-aware route between zones (`?from=&to=&preference=`) |
| `GET` | `/api/audit-log` | Public | Chronological operational intervention logs |
| `GET` | `/api/history/snapshots` | Public | Historical snapshot ticks for time-travel inspection |
| `POST` | `/api/scenario` | **Organizer** | Update what-if simulation parameters (demand surges, transit capacities) |
| `POST` | `/api/scenario/reset` | **Organizer** | Reset all what-if simulation parameters to baseline |
| `POST` | `/api/control/clock` | **Organizer** | Pause/resume simulation clock or adjust speed multiplier |
| `POST` | `/api/alerts/:id/action` | **Organizer** | Execute tactical incident playbook intervention |
| `POST` | `/api/seed` | **Organizer** | Reseed database and rehydrate in-memory state |

---

## 📄 License

This project is licensed under the MIT License.
