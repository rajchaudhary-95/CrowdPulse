# 🎪 CrowdPulse (OmniVenue)
### Pillai University's Alegria Festival Intelligence Platform

> **Real-Time Mega-Event Crowd, Transit & Venue Orchestration Platform**  
> *Deterministic Forecasting • Simplex Linear Programming (LP) Flow Redistribution • Dual Glassmorphic Interfaces*

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=for-the-badge&logo=socket.dot.io&logoColor=white)](https://socket.io/)
[![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [The Problem & The Solution](#-the-problem--the-solution)
- [System Architecture](#-system-architecture)
- [Live Operational Ground-Truth (Alegria Festival)](#-live-operational-ground-truth-alegria-festival)
- [Core Engines & Mathematical Foundations](#-core-engines--mathematical-foundations)
  - [1. Holt's Linear Exponential Smoothing + Event Surges](#1-holts-linear-exponential-smoothing--event-surges)
  - [2. Simplex Linear Programming (LP) Flow Redistribution](#2-simplex-linear-programming-lp-flow-redistribution)
  - [3. Composite Zone Stress Score (0–100)](#3-composite-zone-stress-score-0100)
- [Comprehensive Feature Tour](#-comprehensive-feature-tour)
  - [Organizer Command Center (`/organizer`)](#1-organizer-command-center-organizer)
  - [Visitor Companion Portal (`/visitor`)](#2-visitor-companion-portal-visitor)
  - [Enterprise Security & RBAC](#3-enterprise-security--rbac)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Environment Configuration](#-environment-configuration)
- [Database Setup (Supabase & MongoDB)](#-database-setup-supabase--mongodb)
- [Quick Start Guide](#-quick-start-guide)
- [REST API & WebSocket Reference](#-rest-api--websocket-reference)
- [3-Minute Hackathon Judging Walkthrough](#-3-minute-hackathon-judging-walkthrough)
- [License](#-license)

---

## 🌟 Executive Overview

**CrowdPulse (OmniVenue)** is a full-stack, mission-critical operations and navigation platform engineered for mega-events, stadiums, and university festivals. 

Piloted for **Pillai University's Alegria Festival ("The Festival of Joy")** hosted at the **Dr. K. M. Vasudevan Pillai Campus in New Panvel, Navi Mumbai**, CrowdPulse harmonizes crowd density across 10,000+ daily attendees. It connects event directors, security marshals, transit dispatchers, and attendees into a **single, synchronized operational picture**.

The platform provides a high-density, dark glassmorphic **Organizer Command Center** for real-time incident response, paired with a lightweight, traffic-light **Visitor Companion** that steers attendees toward low-stress pathways, uncrowded food stalls, and optimal train departure windows.

```
+-------------------------------------------------------------------------------------------------+
|                                     CROWDPULSE PLATFORM                                         |
+-----------------------------------------------+-------------------------------------------------+
|          ORGANIZER COMMAND CENTER             |               VISITOR COMPANION                 |
|   • Multi-Layer Heatmap & Vector Map          |   • Clean Traffic-Light Comfort Indicators      |
|   • Simplex LP Flow Optimization Solver       |   • Crowd-Free Alternate Route Finder           |
|   • 1-Click Tactical Incident Playbooks       |   • Egress Window ("Best Time to Move")         |
|   • Interactive "What-If" Scenario Drawer     |   • "Skip the Queues" Concourse Discovery       |
|   • Dynamic Shuttle Scaling (+20% to +60%)    |   • Panvel Local Train Departure Schedule       |
|   • Gate Turnstile Ingress/Egress Controls    |   • Live Audio-Visual Safety Announcements      |
|   • Chronological Operations Audit Trail      |   • Bookmarks & Scheduled Departure Reminders   |
+-----------------------------------------------+-------------------------------------------------+
```

---

## 🎯 The Problem & The Solution

### The Mega-Event Challenge
1. **Concourse Bottlenecks**: High-density surges occur before and after headliner performances (e.g., Celebrity EDM Nights), resulting in severe crush hazards.
2. **Asymmetric Gate Loading**: Attendees concentrate heavily at the primary entrance (Gate 1), while alternate perimeter corridors (Gate 2 & PICA Lawns) remain underutilized.
3. **Transit Gridlocks**: Mass simultaneous egress overwhelms local auto-rickshaw loops and railway stations (Panvel Station).
4. **Information Disconnect**: Organizers possess telemetry but lack automated mitigation tools; visitors navigate blindly into gridlocked concourses.

### The CrowdPulse Solution
- **Deterministic Forecasting**: Predicts crowd pressure 60 minutes into the future by coupling Holt's linear trend smoothing with scheduled performance ticket surge curves.
- **Automated Flow Rebalancing**: Solves multi-corridor transit congestion using an in-house Simplex Linear Programming (LP) optimization engine.
- **Actionable Tactical Playbooks**: Equips commanders with 1-click mitigation levers: auto-rerouting flows, dispatching shuttle fleets, staggering egress schedules, and switching gate turnstiles.
- **Friction-Free Attendee Guidance**: Replaces dense metrics with traffic-light comfort ratings (🟢 Smooth, 🟡 Moderate, 🔴 High) and recommends step-free, low-stress detours.

---

## 🏛️ System Architecture

CrowdPulse is built upon a strict **3-Layer Separation of Concerns**:

```
+-----------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER                                   |
|                      React 19 (Vite) • Leaflet & SVG • Dark Glassmorphism               |
|                                                                                         |
|        [ /organizer - Command Center ]                 [ /visitor - Companion ]         |
|        • Multi-Layer Geospatial Vector Map             • Turn-by-Turn Route Guidance    |
|        • Perimeter Telemetry Matrix                    • Egress Timeline Radar          |
|        • Incident Playbooks & Solver Visualizer        • Live Train Schedule & Alerts   |
|        • What-If Drawer & Audit History                • Concessions & Restroom Radar   |
+--------------------------------------------+--------------------------------------------+
                                             ▲
                          (WebSocket `live:tick` / HTTP REST / Bearer JWT)
                                             ▼
+-----------------------------------------------------------------------------------------+
|                                  ENGINE & LOGIC LAYER                                   |
|                          Node.js • Express • Pure Invariant Services                    |
|                                                                                         |
|   • Forecasting Service: Holt's Double Exponential Smoothing (Level + Trend) + Event S-Curve|
|   • Optimization Service: Simplex LP Matrix Solver (`javascript-lp-solver`)             |
|   • Alert & Playbook Evaluator: Multi-threshold breach analysis (Normal/Elevated/Critical)|
|   • Crowd Dynamics Simulator: 5000ms heartbeat, virtual clock scrubbing & phase shifts   |
|   • Real-Time Dispatcher: Socket.io broadcast engine with delta compression             |
+--------------------------------------------+--------------------------------------------+
                                             ▲
                                             ▼
+-----------------------------------------------------------------------------------------+
|                                DATA & SECURITY LAYER                                    |
|                                                                                         |
|   • Primary Database: Supabase PostgreSQL (Zones, Venues, Edges, Alerts, Snapshots)     |
|   • Authentication & RBAC: Supabase Auth (JWT verification, role clearance)             |
|   • Row Level Security (RLS): Granular table policies for organizers vs visitors        |
|   • Fail-Safe Persistence: High-performance In-Memory State Cache + Local MongoDB       |
|   • External Routing: OpenStreetMap (OSM) CartoDB Tiles + OSRM Routing Engine           |
+-----------------------------------------------------------------------------------------+
```

### Real-Time Event Loop & Tick Lifecycle
1. **Heartbeat Tick (Every 5,000ms)**: The virtual clock advances by 5 simulated minutes.
2. **Dynamics Evaluation**: Ingress, egress, and inter-zone pedestrian flow velocities are calculated based on active festival schedules.
3. **Forecasting Run**: Holt's smoothing extrapolates occupancy trends across all 6 zones over a 60-minute forward horizon.
4. **Breach & Rule Evaluation**: If any zone or edge breaches thresholds (> 88% critical), actionable alerts are triggered.
5. **LP Optimization Evaluation**: If congestion is detected, the Simplex solver calculates an optimal crowd redistribution matrix.
6. **Broadcast Dispatch**: A consolidated payload is pushed via Socket.io (`live:tick`) to all connected Command Center and Visitor clients.

---

## 📍 Live Operational Ground-Truth (Alegria Festival)

CrowdPulse is calibrated against the real layout of **Dr. K. M. Vasudevan Pillai Campus, Sector 16, New Panvel, Navi Mumbai**:

| Zone ID | Zone Name | Category | Capacity | Ground-Truth Role & Chokepoint Dynamics |
| :--- | :--- | :--- | :--- | :--- |
| `zone-main-ground` | **Alegria Main Concert Ground** | Venue Cluster | 7,000 | 10k capacity sports arena hosting the Celebrity Headliner & EDM Night. Major exit crush post 22:30. |
| `zone-quadrangle` | **The Central Quadrangle (The Quad)** | Venue Cluster | 2,500 | Central student crossing hub. Hosts daytime Band Battles, Flashmobs, and high concourse friction. |
| `zone-canteen-back` | **Campus Canteen & Boys Gate 2** | Hospitality / Access | 1,800 | Dedicated Boys entry gate with security frisking, cafeteria food stalls, and internal walkways. |
| `zone-atrium-main` | **Engineering Atrium & Gate 1** | Venue Cluster / Access| 2,000 | Main Sector 16 Entrance. Dedicated Girls, Artists & VIP access with RFID/ID turnstiles. |
| `zone-sports-ground` | **PICA Lawn & Sports Ground** | Buffer / Green Lawn | 2,000 | Open architecture wing lawns with acoustic stages and a step-free ADA bypass avoiding Quad chokes. |
| `zone-panvel-transit`| **Panvel Station & Transit Hub** | Transit Feeder | 3,000 | Panvel Railway Station feeder, NMMT bus stop, and Sector 16 share-auto rickshaw depot. |

### Strategic Transit Corridors & Bypasses
- **Central Axis (`edge-quad-mainground`)**: Direct walkway between Quad and Main Arena. Subject to heavy gridlock (92% utilization) during headliner transitions.
- **PICA Sports Ground Bypass (`edge-canteen-sports` & `edge-sports-mainground`)**: Low-stress alternate path bypassing the Quad. Diverts up to 1,500 attendees with zero bottlenecks.
- **Emergency Corridor (`edge-emergency-gate3`)**: Restricted access corridor connecting Main Stage Backstage to Gate 3 for ambulance and security egress.
- **Sector 16 Auto Loop (`edge-depot-maingate`)**: High-throughput shuttle and share-auto loop connecting Panvel Station to Campus Gate 1.

---

## 🧮 Core Engines & Mathematical Foundations

### 1. Holt's Linear Exponential Smoothing + Event Surges
To prevent false alarms caused by temporary spikes while capturing genuine crowd waves, CrowdPulse implements double exponential smoothing with additive trend and event schedule surge adjustments:

$$\begin{aligned}
\text{Level Equation:} \quad & L_t = \alpha Y_t + (1 - \alpha)(L_{t-1} + T_{t-1}) \\
\text{Trend Equation:} \quad & T_t = \beta (L_t - L_{t-1}) + (1 - \beta) T_{t-1} \\
\text{Projected Forecast:} \quad & \hat{Y}_{t+k} = L_t + k \cdot T_t + \sum_{e \in \text{Events}} S_e(t+k)
\end{aligned}$$

Where:
- $\alpha = 0.40$: Level smoothing factor.
- $\beta = 0.20$: Trend smoothing factor.
- $k = 12$ ticks: 60-minute forward projection horizon.
- $S_e(t+k)$: Event surge modifier derived from scheduled ticket counts, door opening curves, and headliner finale bell-curves.

### 2. Simplex Linear Programming (LP) Flow Redistribution
When corridor congestion exceeds acceptable limits, the system models pedestrian flow as a minimum-cost, bounded-capacity multi-commodity network flow problem using an in-house Simplex LP formulation (`javascript-lp-solver`):

$$\begin{aligned}
\min \quad & Z = \sum_{e \in E} \left( c_e \cdot x_e + P_e(x_e) \right) \\
\text{subject to:} \quad & x_e \le \text{Capacity}_e \quad \forall e \in E \\
& \sum_{e \in \text{Out}(v)} x_e - \sum_{e \in \text{In}(v)} x_e = b_v \quad \forall v \in V \\
& x_e \ge 0 \quad \forall e \in E
\end{aligned}$$

Where:
- $x_e$: Flow of attendees routed through transit edge $e$.
- $c_e$: Base travel impedance (physical distance and nominal transit time).
- $P_e(x_e)$: Non-linear congestion penalty function triggered when utilization exceeds 75%.
- $b_v$: Net crowd ingress/egress demand at zone $v$.

**Operational Output**: Automatically reroutes up to **1,250 attendees** away from the choked Quadrangle concourse through the PICA Lawn Sports Ground Bypass, reducing concourse congestion by **18%**.

### 3. Composite Zone Stress Score (0–100)
A unified metric reflecting overall physical and logistical pressure within each perimeter zone:

$$\text{Stress Score} = 100 \times \left( 0.50 \cdot \frac{\text{Occ}_{\text{venue}}}{\text{Cap}_{\text{venue}}} + 0.35 \cdot \text{Pressure}_{\text{transit}} + 0.15 \cdot \frac{\text{Occ}_{\text{hosp}}}{\text{Cap}_{\text{hosp}}} \right)$$

| Stress Range | Status Classification | Visual Cue | Operational Protocol |
| :--- | :--- | :--- | :--- |
| **0 – 59** | **Normal** | 🟢 Green | Routine monitoring; standard walkway circulation. |
| **60 – 74** | **Elevated** | 🟡 Amber | Pre-alert state; prepare standby shuttle fleets. |
| **75 – 87** | **Warning** | 🟠 Orange | Recommend low-stress bypass routes on Visitor Companion. |
| **88 – 100** | **Critical Breach** | 🔴 Red | Dispatch marshals, trigger auto-rerouting, reverse gate turnstiles. |

---

## 💻 Comprehensive Feature Tour

### 1. Organizer Command Center (`/organizer`)

Designed for event operations directors, campus security chiefs, transit dispatchers, and incident commanders:

```
+---------------------------------------------------------------------------------------------+
| [CROWDPULSE COMMAND CENTER]        Simulated Time: 21:45 IST [▶ LIVE 2x]      User: Lead Op |
+---------------------------------------------------------------------------------------------+
| [Occupancy: 82%]  [Active Visitors: 9,250]  [Transit Load: 74%]  [Stress Score: 68/100 AMBER]|
+-------------------------------------------------------------+-------------------------------+
|  CAMPUS GEOSPATIAL VECTOR MAP                               | INCIDENT PLAYBOOKS & ALERTS   |
|  • Dynamic Heatmap Contours (Density Gradients)             | 🔴 CRITICAL: Main Concourse   |
|  • Directional Transit Vectors (Flow & Congestion)          |   Crowd Pressure: 92% (>88%)  |
|  • Interactive Zone Polygons with Live Metrics              |   [⚡ Auto-Reroute Solver]    |
|  • ADA Accessible / Step-Free Ramps Overlay                 |   [🚌 Boost Shuttles +40%]    |
|  • Emergency Corridor (Gate 3 Backstage Ambulance Path)     |   [⏱️ Stagger Egress +30m]   |
|  • Interactive Zone Focus & Telemetry Modal                 |   [📢 Push Mobile Advisory]   |
|                                                             |   [🚪 Switch Gate 1 & 2 Mode] |
+-------------------------------------------------------------+-------------------------------+
|  PERIMETER TELEMETRY MATRIX                                 | SIMPLEX LP SOLVER PREVIEW     |
|  [Zone]          [Occupancy]   [Cap]    [Transit]  [Stress] | • Optimal Flow: -18% Choke    |
|  Main Ground     5,850 (84%)   7,000    0.92       88 (CRIT)| • Diverted: 1,250 via PICA    |
|  The Quad        1,850 (74%)   2,500    0.68       66 (ELEV)| [ 🔄 Apply Solver Actions ]   |
|  Canteen Gate 2  1,100 (61%)   1,800    0.48       46 (NORM)|-------------------------------|
|  Atrium Gate 1   1,350 (68%)   2,000    0.54       52 (NORM)| AUDIT TRAIL                   |
|  PICA Lawn         550 (28%)   2,000    0.22       24 (NORM)| 21:42: Boosted Shuttles +40%  |
|  Panvel Depot    2,200 (73%)   3,000    0.65       58 (NORM)| 21:38: Rerouted flow via PICA |
+-------------------------------------------------------------+-------------------------------+
```

#### Key Capabilities:
- **Interactive Multi-Layer Campus Vector Map**:
  - **Dynamic Heatmap Contours**: Visualizes real-time crowd pressure gradients across campus grounds.
  - **Transit Flow Vectors**: Polylines color-coded by congestion level (green = free flow, amber = moderate, red = gridlock) with animated pulse indicators.
  - **ADA Step-Free Ramps Layer**: Highlights accessible routes including the PICA Architecture ramp and elevator concourses.
  - **Emergency Corridors**: Dedicated high-visibility paths for emergency medical vehicles connecting the Main Stage to Gate 3.
  - **Deep-Dive Zone Telemetry**: Click any zone to view real-time sensor metrics, turnstile inflow rates, and 60-minute forward projections.
- **Simplex LP Flow Optimization Visualizer**:
  - Displays computed flow redistribution recommendations with real-time impact assessments (e.g. `-18% concourse congestion`, `1,250 attendees rerouted`).
  - Single-click **"Apply Solver Actions"** button pushes dynamic overrides to live routing engines.
- **Incident Response Playbooks**:
  - `[⚡ Auto-Reroute]`: Automatically balances flow across alternate corridors.
  - `[🚌 Dynamic Shuttle Fleet Scaling]`: Slider to deploy +20%, +40%, or +60% additional shuttle/share-auto capacity to Sector 16 loop.
  - `[⏱️ Stagger Egress Schedules]`: Injects a +30 minute delay offset between EDM and Flashmob event conclusions, flattening the egress peak.
  - `[📢 Targeted Mobile Advisory]`: Composes and broadcasts instant safety notifications to attendee mobile feeds.
  - `[🚪 Dynamic Gate Turnstile Reversal]`: Reverses Gate 1 and Gate 2 turnstiles from 100% Entry (Daytime Ingress) to 100% Exit (Night Egress).
  - `[👮 Dispatch Marshals]`: Dispatches security staff to physical chokepoints and records timestamped audit logs.
  - `[✅ Resolve Incident]`: Clears alert status upon hazard mitigation.
- **Interactive "What-If" Simulation Drawer**:
  - **Demand Surge Multiplier (1.0x – 2.0x)**: Test campus resilience under unexpected crowd spikes.
  - **Transit Capacity Modifiers**: Simulate corridor closures or enhanced transit fleet deployments.
  - **Event Schedule Delays**: Model the ripple effects of delayed artist sets or overtime performances.
- **Virtual Simulation Clock & Timeline Scrubbing**:
  - Pause/Resume clock or run at 1x, 2x, 5x, or 10x simulation speed.
  - Jump instantly between key operational phases:
    - **Daytime Ingress Rush (14:00 – 17:00)**: Gate 1 & 2 dedicated to rapid student check-in.
    - **Peak Concurrency (18:00 – 21:00)**: Bidirectional concourse movement between stages.
    - **Night Egress & Mass Exit (22:00 – 23:30)**: Turnstiles reversed; mass outflow toward Panvel Station.
- **Live Operational Audit Trail**:
  - Immutable, chronological log recording all actions taken by operators (who executed what, parameter values, and exact timestamps). Includes search filtering and clearing capabilities.
- **Zen / Fullscreen Projector Mode**:
  - Press `F` or click **Zen Mode** to maximize the map and telemetry matrix for command center projectors and multi-monitor setups.

---

### 2. Visitor Companion Portal (`/visitor`)

Designed for attendees to navigate the festival effortlessly without cognitive overload:

```
+---------------------------------------------------------------------------------------------+
| 🎪 ALEGRIA VISITOR COMPANION                    Festival Status: 🟢 Smooth Flow (Normal)    |
+---------------------------------------------------------------------------------------------+
| 🌙 NIGHT EGRESS SURGE IN EFFECT • GATES 1 & 2 CONVERTED TO FULL OUTFLOW EXIT               |
+---------------------------------------------------------------------------------------------+
| 🧭 SMART CAMPUS ROUTE FINDER                                                                |
| Origin: [ Gate 1 - Front Gate        ▼ ]    Destination: [ Alegria Main Concert Ground   ▼ ]|
|                                                                                             |
| [ 🌿 Crowd-Free Alternate Path (Recommended) ]      [ Standard Direct Path ]                |
| • Walking Time: 4 mins (Saves 5 mins!)              • Walking Time: 9 mins                  |
| • Distance: 390m • Stress Level: 🟢 Low              • Distance: 320m • Stress Level: 🔴 Choke|
| • Route: Gate 1 ➔ PICA Architecture Ramp ➔ North Lawn Bypass (Step-Free ADA Accessible)     |
| [ Live Turn-by-Turn Directions ]                                                            |
+---------------------------------------------------------------------------------------------+
| ⏱️ BEST TIME TO MOVE (EGRESS RADAR)                                                         |
| Optimal Departure Window: [ 21:30 - 22:15 ] • Recommended exit before EDM finale surge      |
| [=================== NORMAL ===================|======== SURGE CHOKE (22:30) =======]       |
+---------------------------------------------------------------------------------------------+
| 🔍 SKIP THE QUEUES (LIVE CONCOURSE RADAR)                                                   |
| [ 🍔 Food ]    [ 🌳 Chill Spots ]    [ 📺 4K Screens ]    [ 🚻 Restrooms ]   [ 🚖 Transit ] |
|                                                                                             |
| • Campus Canteen Plaza: Frankie, Dosa & Juices • 3 min wait • UPI Enabled                   |
| • PICA Architecture Lawn: Shaded benches, Phone charging stations, Free water • 0 min wait  |
| • Engineering Restroom Suite: 10 clean stalls, Wheelchair accessible • 0 min wait           |
| • Sector 16 Auto Stand: Continuous share-autos to Panvel Station (₹25-30) • 2 min wait       |
+---------------------------------------------------------------------------------------------+
| 🚆 LIVE PANVEL LOCAL TRAIN DEPARTURES                                                       |
| • 22:05 CSMT (Harbour Line)       • Platform 2 • Crowd: 🟢 Low      • On Time               |
| • 22:12 Thane (Trans-Harbour)     • Platform 1 • Crowd: 🟡 Moderate • +2m Delay             |
| • 22:19 CSMT Fast (Harbour Line)  • Platform 3 • Crowd: 🟡 Moderate • On Time               |
| • 22:28 Goregaon (Western Link)   • Platform 2 • Crowd: 🟢 Low      • On Time               |
+---------------------------------------------------------------------------------------------+
| 📢 CAMPUS SAFETY ANNOUNCEMENTS                                                              |
| • "Gate 1 dedicated to Girls, VIPs & Artists. Boys please enter via Canteen Gate 2."         |
| • "Main Stage North lawn bypass open with zero delay."                                       |
| [ ⭐ Bookmark Venue ]     [ 🔔 Set Departure Reminder: 22:00 ]                             |
+---------------------------------------------------------------------------------------------+
```

#### Key Capabilities:
- **Intuitive Traffic-Light Comfort Status**:
  - Replaces raw occupancy figures with clear status badges:
    - 🟢 **Smooth & Clear**: Open corridors, turnstile wait times < 2 mins.
    - 🟡 **Moderate Flow**: Steady concourse movement, checkpoint wait times 3–6 mins.
    - 🔴 **High Congestion**: Packed concourses, wait times 10–20 mins; delay or bypass suggested.
- **Crowd-Aware 1-Tap Route Finder**:
  - Select origin and destination to compare routes in real time:
    - **Direct Concourse Path**: Shortest distance, but highlights high-friction chokepoints.
    - **🌿 Crowd-Free Alternate Path (Recommended)**: Low-stress detour (e.g., via PICA Lawn step-free ramp) detailing time savings (e.g., *Saves 5 minutes!*), distance, and comfort rating.
  - Interactive SVG map renders paths dynamically with animated directional guides.
- **Dynamic "Best Time to Move" Egress Window Advisory**:
  - Evaluates live concert schedules and historical surge models to recommend the optimal 30-minute departure window, enabling attendees to exit safely before mass stadium egress.
- **"Skip the Queues" Facility Discovery Radar**:
  - 🍔 **Food**: Instant-service cafeteria stalls (Nescafe, Frankie, Dosa, Juices, UPI enabled) vs crowded concert kiosks.
  - 🌳 **Chill Spots**: Quiet lawns, shaded tree benches, acoustic comfort zones, phone charging stations, and free chilled water dispensers.
  - 📺 **4K Simulcast Screens**: High-definition viewing areas outside the main arena (The Quad Mega Screen, Sports Turf Screen).
  - 🚻 **Restrooms**: Sanitation clusters showing queue times, accessibility status, and cleaning schedules.
  - 🚖 **Transit Hubs**: Real-time availability of Sector 16 share-autos to Panvel Station (₹25-30) and NMMT feeder buses (Routes 24 & 50).
- **Live Panvel Local Train Schedule**:
  - Live departure boards for Harbour Line (CSMT, Wadala Road), Trans-Harbour Line (Thane), and Western Link (Goregaon) with platform numbers, crowd ratings, and delay tracking.
- **Official Live Announcements Ticker**:
  - Pinned safety advisories and venue updates dispatched directly by the Command Center.
- **Event Bookmarks & Departure Reminders**:
  - 1-click bookmarking for venues and stalls, paired with scheduled departure reminders that trigger browser notifications.

---

### 3. Enterprise Security & RBAC

- **Authentication via Supabase Auth**:
  - Email/password authentication verified via `@supabase/supabase-js`.
  - Automatic `profiles` record creation via PostgreSQL triggers on `auth.users` insertion.
- **Role-Based Access Control (RBAC)**:
  - `organizer`: Full access to Command Center, Simplex solver controls, incident playbooks, and what-if simulation sliders.
  - `visitor`: Attendee navigation portal; protected against unauthorized operational actions.
  - `admin`: Superuser clearance.
- **Server-Side Security Middleware**:
  - State-mutating REST endpoints (`/api/scenario`, `/api/control/clock`, `/api/control/gates/toggle`, `/api/seed`, `/api/alerts/:id/action`) verify Supabase JWT Bearer tokens and enforce role clearance.
- **Graceful Cloud-to-Local Fallback**:
  - If Supabase cloud credentials are not supplied or network connectivity drops, the server falls back seamlessly to an in-memory state engine and local MongoDB store without downtime.

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | **React 19**, **Vite 8.2**, **Vanilla CSS** | High-performance reactive interface with dark glassmorphism design system |
| **Mapping & Geospatial** | **Leaflet 1.9**, **React-Leaflet 5.0**, **SVG** | Dual-mode mapping: High-density interactive vector map & clean pastel visitor map |
| **Icons & Visuals** | **Lucide React** | Consistent, modern icon library across all dashboard modules |
| **Real-Time Transport** | **Socket.io 4.8** (Client & Server) | Sub-100ms bi-directional state synchronization and alert broadcasting |
| **Backend Runtime** | **Node.js 18+**, **Express 4.21** | REST API endpoints, middleware authentication, and simulation daemon |
| **Optimization Engine** | **javascript-lp-solver 0.4** | In-house Simplex Linear Programming (LP) network flow optimization solver |
| **Forecasting Engine** | **Pure JavaScript Math Services** | Double exponential smoothing (Holt's method) + event surge curve modeling |
| **Cloud Database & Auth** | **Supabase PostgreSQL & Auth** | Cloud persistence, JWT authentication, and Row Level Security (RLS) |
| **Local Fallback Database**| **MongoDB 6+**, **Mongoose 8.9** | Resilient offline database fallback and time-series snapshot storage |
| **Routing & Tiles** | **OSRM API**, **OpenStreetMap (CartoDB)** | Free-tier driving/walking route calculations and map tile layers |

---

## 📦 Repository Structure

```
HackCelestial4/
├── client/                               # Frontend React 19 Application
│   ├── src/
│   │   ├── components/                   # Reusable UI & Map Components
│   │   │   ├── AlertsFeed.jsx            # Live incident feed with 1-click playbooks
│   │   │   ├── AuthModal.jsx             # Supabase Auth login/registration modal
│   │   │   ├── MapView.jsx               # Leaflet & SVG dual-mode campus map
│   │   │   ├── MetricsHeader.jsx         # System occupancy, transit load & stress HUD
│   │   │   ├── Navbar.jsx                # Responsive navigation & role badges
│   │   │   ├── OptimizationPanel.jsx     # Simplex LP flow redistribution visualizer
│   │   │   ├── UserProfileMenu.jsx       # User profile dropdown & sign-out
│   │   │   └── WhatIfDrawer.jsx          # Simulation levers (demand, capacity, offsets)
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Supabase session management & role state
│   │   ├── pages/
│   │   │   ├── OrganizerDashboard.jsx    # High-density Command Center interface
│   │   │   └── VisitorGuidance.jsx       # Friction-free attendee companion interface
│   │   ├── services/
│   │   │   ├── api.js                    # REST API client with JWT interception
│   │   │   ├── socket.js                 # Socket.io client listener & emitter
│   │   │   └── supabaseClient.js         # Supabase SDK client initialization
│   │   ├── App.jsx                       # Root application component & role routing
│   │   ├── index.css                     # Glassmorphic tokens, CSS variables & animations
│   │   └── main.jsx                      # Vite entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                               # Backend Engine & Services
│   ├── config/
│   │   ├── db.js                         # Database connection manager (Supabase / MongoDB)
│   │   ├── supabase.js                   # Server-side Supabase client (Service Role)
│   │   └── thresholds.js                 # Centralized operational thresholds & constants
│   ├── middleware/
│   │   └── auth.middleware.js            # JWT Bearer verification, RBAC & audit logger
│   ├── models/                           # Mongoose Schemas (Offline Fallback)
│   │   ├── Alert.js                      # Incident breach schema
│   │   ├── TransitEdge.js                # Transit corridor schema
│   │   ├── Venue.js                      # Venue & scheduled event schema
│   │   ├── VisitorFlowSnapshot.js        # Time-series historical snapshot schema
│   │   └── Zone.js                       # Perimeter zone schema
│   ├── routes/
│   │   └── api.routes.js                 # REST API endpoints
│   ├── services/                         # Pure Deterministic Business Logic
│   │   ├── alert.service.js              # Threshold evaluation & predictive alert engine
│   │   ├── forecasting.service.js        # Holt's linear smoothing & event surge math
│   │   └── optimization.service.js       # Simplex LP crowd redistribution solver
│   ├── simulator/
│   │   ├── crowdSimulator.js             # Simulation daemon, virtual clock & state manager
│   │   └── mockData.js                   # Alegria campus seed data (zones, venues, gates)
│   ├── index.js                          # Express & Socket.io server entry point
│   ├── package.json
│   ├── test-handshake.js                 # Pre-flight environment & database verification
│   ├── test-services.js                  # Unit tests for pure mathematical services
│   └── test-integration.js               # End-to-end integration & RBAC tests
│
├── supabase/
│   └── schema.sql                        # PostgreSQL schema, RLS policies & seed data
│
├── .env.example                          # Environment variables template
├── package.json                          # Unified workspace scripts
└── README.md                             # Comprehensive project documentation
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Provider ('supabase' or 'mongodb')
DB_PROVIDER=supabase

# Supabase Cloud Credentials (Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# Vite Frontend Supabase Keys (Used by React Client)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Local MongoDB Fallback (Used if DB_PROVIDER=mongodb or cloud offline)
MONGODB_URI=mongodb://127.0.0.1:27017/crowdpulse

# Real-Time Simulation Heartbeat
TICK_INTERVAL_MS=5000
SIMULATION_SPEED=1

# External Routing Endpoints
OSRM_BASE_URL=http://router.project-osrm.org/route/v1/driving
OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

---

## 🗄️ Database Setup (Supabase & MongoDB)

### Setting up Supabase PostgreSQL (Recommended)
1. Create a free project on [supabase.com](https://supabase.com).
2. Open the **SQL Editor** tab in your Supabase dashboard.
3. Open [`supabase/schema.sql`](supabase/schema.sql), paste the entire script into the editor, and click **Run**.
4. The script will configure:
   - `profiles` table with automatic triggers on `auth.users` registration.
   - `zones`, `venues`, and `transit_edges` tables.
   - `alerts` and `audit_logs` tables.
   - `visitor_flow_snapshots` table for historical time-series analytics.
   - Row Level Security (RLS) policies allowing public reads and restricting mutations to authenticated organizers.
   - Seed datasets for all 6 Pillai University campus zones, venues, and corridors.
5. Copy your **Project URL**, **Anon Key**, and **Service Role Key** into your root `.env` file.

### Local MongoDB Setup (Optional Fallback)
If you prefer running offline without cloud dependencies:
1. Ensure local MongoDB is running: `mongod --dbpath /data/db` (default port: `27017`).
2. Set `DB_PROVIDER=mongodb` in `.env`.
3. The platform will automatically seed and manage collections on first boot.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Git**

### 2. Installation
Clone the repository and install dependencies for both server and client:

```bash
# Clone the repository
git clone https://github.com/rajchaudhary-95/CrowdPulse.git
cd CrowdPulse

# Install server dependencies
npm --prefix server install

# Install client dependencies
npm --prefix client install
```

### 3. Run the Verification Suite
Execute the automated test pipeline to verify environment setup, mathematical engines, and REST endpoints:

```bash
npm test
```

This runs three test suites:
1. **Pre-flight Handshake (`test-handshake.js`)**: Validates `.env`, database reachability, Simplex LP feasibility, and map tile endpoints.
2. **Pure Services Unit Tests (`test-services.js`)**: Tests Holt's forecasting, LP redistribution algorithms, and alert rules.
3. **Integration Test (`test-integration.js`)**: Boots an in-memory server instance, validates all REST routes, and verifies RBAC token enforcement.

### 4. Start the Application
Run both backend and frontend servers:

```bash
# Terminal 1: Backend Server & Real-Time Simulation Daemon
npm run dev:server

# Terminal 2: Frontend React Application
npm run dev:client
```

- **Frontend Client**: [`http://localhost:5173`](http://localhost:5173)
- **Backend API & WebSocket**: [`http://localhost:5000`](http://localhost:5000)

---

## 📡 REST API & WebSocket Reference

### Public Endpoints (Accessible by Visitors & Organizers)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | System health, simulated virtual time, zone/venue entity counts |
| `GET` | `/api/state` | Complete state payload (zones, edges, forecast, alerts, recommendations) |
| `GET` | `/api/zones` | List all 6 campus zones with live occupancy and stress metrics |
| `GET` | `/api/venues` | List all venues, scheduled events, and attendance limits |
| `GET` | `/api/transit` | List all transit edges, throughput flows, and congestion indices |
| `GET` | `/api/forecast` | 60-minute forward predictive projection across all zones |
| `GET` | `/api/alerts` | List all active incident warnings and critical breaches |
| `GET` | `/api/recommendations` | Current Simplex LP solver redistribution actions |
| `GET` | `/api/visitor/route` | Compute crowd-aware path between zones (`?from=&to=&preference=`) |
| `GET` | `/api/visitor/egress-window` | Optimal departure window recommendation before mass exit |
| `GET` | `/api/visitor/concessions` | Concourse radar for food, chill spots, 4K screens, and restrooms |
| `GET` | `/api/visitor/wait-times` | Estimated wait times across gates, stalls, and facilities |
| `GET` | `/api/visitor/announcements` | Active campus safety and operational announcements |
| `GET` | `/api/gates/status` | Real-time turnstile operational status (Ingress vs Egress) |
| `GET` | `/api/audit-log` | Chronological operational intervention logs |
| `GET` | `/api/history/snapshots` | Historical snapshot ticks for time-travel review |

### Protected Organizer Endpoints (Requires `organizer` Role & JWT Bearer)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/scenario` | Update what-if simulation parameters (demand multipliers, capacities) |
| `POST` | `/api/scenario/reset` | Reset all simulation parameters to live operational baseline |
| `POST` | `/api/control/clock` | Pause/resume clock, change speed multiplier, scrub time, or jump phase |
| `POST` | `/api/control/gates/toggle` | Manually switch gate turnstiles between Entry, Exit, and Emergency modes |
| `POST` | `/api/alerts/:id/action` | Execute tactical incident playbook intervention (`auto_reroute`, `boost_shuttles`, etc.) |
| `POST` | `/api/visitor/announcements`| Broadcast emergency safety advisory to all attendee mobile feeds |
| `POST` | `/api/seed` | Reseed database and rehydrate in-memory state |

### Real-Time WebSocket Events (`Socket.io`)
| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `live:tick` | Server ➔ Client | Full client state payload | Dispatched every 5,000ms with updated metrics and positions |
| `live:alert` | Server ➔ Client | Alert object | Dispatched immediately when a threshold is breached |
| `live:announcement`| Server ➔ Client | Announcement object | Dispatched when an organizer broadcasts an advisory |
| `client:ack` | Client ➔ Server | `{ alertId }` | Acknowledges receipt of an alert from an operator console |

---

## 🏆 3-Minute Hackathon Judging Walkthrough

Use this script to demonstrate the platform effectively during judging sessions:

```
+-----------------------------------------------------------------------------------------------+
| MINUTE 1: The Problem & The Visitor Experience                                                |
| 1. Open http://localhost:5173/visitor.                                                        |
| 2. Highlight the Traffic-Light Status: Attendees see clear comfort ratings (🟢 Smooth Flow),    |
|    not confusing operational metrics.                                                         |
| 3. Test Route Finder: Select Origin "Gate 1 - Front Gate" and Destination "Main Ground".      |
|    Show how CrowdPulse detects the choked Quadrangle concourse and automatically recommends   |
|    the "🌿 Crowd-Free Alternate Path" via the PICA Architecture ramp, saving 5 minutes.       |
| 4. Demonstrate "Skip the Queues": Show live wait times for food stalls, shaded chill spots,   |
|    and the live Panvel Station local train departure board.                                   |
+-----------------------------------------------------------------------------------------------+
| MINUTE 2: Command Center Telemetry & Predictive Breach                                        |
| 1. Switch to http://localhost:5173/organizer (Command Center).                                 |
| 2. Showcase the Dark Glassmorphic UI: Multi-layer vector map, live transit flow vectors,      |
|    and the Perimeter Telemetry Matrix monitoring all 6 campus zones.                          |
| 3. Explain the Predictive Engine: Show the 60-minute forward forecast powered by Holt's       |
|    linear smoothing. Point out the active alert: Main Stage Arena Concourse reaching 92%      |
|    capacity breach due to the scheduled EDM Night concert wave.                              |
+-----------------------------------------------------------------------------------------------+
| MINUTE 3: Simplex LP Optimization & 1-Click Mitigation                                        |
| 1. Inspect the Simplex LP Solver Visualizer: Point out the calculated action to reroute       |
|    1,250 attendees via the PICA Lawn bypass to reduce concourse congestion by 18%.            |
| 2. Execute 1-Click Playbooks:                                                                 |
|    • Click [⚡ Auto-Reroute] to apply the Simplex flow redistribution.                        |
|    • Click [🚌 Boost Shuttles] (+40%) to expand Sector 16 transit throughput.                 |
|    • Click [⏱️ Stagger Egress] (+30m) to offset the EDM conclusion wave.                      |
| 3. Switch Gate Phase: Shift the operational phase from Daytime Ingress to Night Egress.      |
|    Notice how Gate 1 & Gate 2 turnstiles instantly flip from Entry to Exit outflow mode.      |
| 4. Open the Operations Audit Trail to prove that every single action, timestamp, and operator  |
|    email was immutably recorded for complete post-event accountability.                       |
+-----------------------------------------------------------------------------------------------+
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for full details.

---

<div align="center">
  <sub>Built with ❤️ by the HackCelestial Team for Pillai University's Alegria Festival 2026.</sub>
</div>
