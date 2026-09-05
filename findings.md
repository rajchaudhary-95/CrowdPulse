# Findings & Technical Research

## 1. Linear Programming Solver (`javascript-lp-solver`)
* **Package:** `javascript-lp-solver` (NPM, zero external dependency, pure JS)
* **Reallocation Formulation:**
  * **Objective:** Minimize overall system peak stress: $\min \sum_{z} \text{Stress}_z^2$ (linearized as min-max penalty or slack variables).
  * **Variables:** $X_{ij}$ = visitor flow rerouted or shuttle capacity diverted from Zone $i$ to Zone $j$.
  * **Constraints:**
    1. Edge capacity bounds: $X_{ij} \le \text{TransitCapacity}_{ij}$
    2. Zone absorption limits: $\text{Occupancy}_j + \sum_i X_{ij} \le \text{MaxCapacity}_j$
    3. Non-negativity: $X_{ij} \ge 0$
  * **Outcome:** Runs deterministically within 5-15ms in Node.js event loop without blocking.

## 2. In-House Time Series Forecasting
* **Technique:** Double Exponential Smoothing (Holt's Linear Trend) + Event Surge Multiplier.
* **Equation:**
  * Level: $L_t = \alpha Y_t + (1 - \alpha)(L_{t-1} + B_{t-1})$
  * Trend: $B_t = \beta (L_t - L_{t-1}) + (1 - \beta) B_{t-1}$
  * Forecast: $\hat{Y}_{t+m} = (L_t + m B_t) \times \text{SurgeMultiplier}(t+m)$
* **Advantage:** Self-contained, zero API rate limits or latency, pure mathematical logic easily inspectable by hackathon evaluators.

## 3. Map & Routing (100% Free Tier, No Keys)
* **Base Map Tiles:** OpenStreetMap via Leaflet.js (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
* **Routing Engine:** OSRM Public Demo Server (`http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson`).
  * Fallback: Straight-line Euclidean distance with haversine calculation if network or demo server throttles.
* **Zone Overlays:** Leaflet GeoJSON Polygon layers with dynamic color coding driven by `compositeStressScore`.

## 4. Real-time Architecture & In-Memory Tick Engine
* **Engine:** Node.js `setInterval` driving simulated time clock (e.g., 5-minute event intervals every 5 seconds real-time).
* **Broadcast Channel:** `Socket.io` room broadcasts to `/organizer` (full cluster telemetry) and `/visitor` (zone recommendations & travel windows).
* **Storage Persistence:** High-frequency metrics stay in-memory; periodic aggregated snapshots flush to MongoDB every $N$ ticks for history/replay.