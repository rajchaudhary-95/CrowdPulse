# Architecture Standard Operating Procedure (SOP) - 3-Layer Build

## Overview
This system is engineered for mega-event crowd, transit, and venue orchestration. To guarantee real-time reactivity, zero crashes, and explainable decision-making during judging, the codebase strictly maintains **Three-Layer Separation**.

---

## Layer 1: Data Layer (Persistence & Real-Time Cache)
- **Primary Source of Truth (Persistence):** MongoDB (`Zone`, `Venue`, `TransitEdge`, `VisitorFlowSnapshot`, `Alert`).
- **In-Memory Live Cache:** Hot state held in `crowdSimulator.js` (`Map<string, Zone>`, `Map<string, Edge>`) to enable 5-second tick rates without database write bottlenecks.
- **Sync Protocol:**
  - On startup: Database is seeded or hydrated into memory.
  - On tick: State is updated in memory and broadcasted via WebSockets.
  - Every 6 ticks (30s simulated time): A snapshot is batched and written asynchronously to MongoDB.
- **Fail-Safe Invariant:** If MongoDB becomes temporarily unavailable, the in-memory simulation and WebSocket broadcasting continue uninterrupted.

---

## Layer 2: Logic Layer (Pure, Deterministic Services)
All business logic is isolated in `/server/services/` as pure, side-effect-free JavaScript functions:
1. **Forecasting Service (`forecasting.service.js`):**
   - Applies Holt-Winters double exponential smoothing over sliding snapshot history.
   - Computes event surge multipliers based on ticketed attendance and time until event start/end.
   - Returns forward-looking 30/60/90-minute stress predictions.
2. **Optimization Service (`optimization.service.js`):**
   - Ingests zone capacity deltas and transit topology.
   - Formulates a linear programming model using `javascript-lp-solver`.
   - Solves for optimal flow diversion and shuttle reallocations to minimize peak zone congestion.
3. **Alert Engine (`alert.service.js`):**
   - Evaluates composite stress scores against centralized thresholds.
   - Assigns severity (`info`, `warning`, `critical`) and links actionable recommendations.
- **Fail-Safe Invariant:** If any service receives incomplete or corrupt data, it must return a valid default/fallback structure instead of throwing unhandled exceptions.

---

## Layer 3: Presentation & Transport Layer
- **Express REST API (`/server/routes/api.routes.js`):** Provides read-only snapshots and control mutations (scenario what-if sliders, database seeding).
- **Socket.io WebSocket Server (`/server/index.js`):**
  - Room `organizers`: Receives high-frequency telemetry, edge bottlenecks, and operator recommendations.
  - Room `visitors`: Receives high-level zone comfort statuses, optimal arrival windows, and alternate route guidance.
- **Fail-Safe Invariant:** Client disconnection or network latency never degrades server-side simulation loop timing.
