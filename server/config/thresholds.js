/**
 * Centralized Thresholds and Operational Constants
 * Invariant: No hidden magic numbers scattered across services.
 */

module.exports = {
  // Zone & Transit Stress Index Thresholds (0 - 100)
  STRESS_THRESHOLDS: {
    NORMAL_MAX: 60,       // < 60 = Normal (Green)
    ELEVATED_MAX: 75,     // 60 - 75 = Elevated (Amber)
    WARNING_MAX: 88,      // 75 - 88 = Warning (Orange)
    CRITICAL_MIN: 88,     // > 88 = Critical Capacity Breach (Red)
  },

  // Weightings for Zone Composite Stress Score Calculation
  STRESS_WEIGHTS: {
    VENUE_OCCUPANCY: 0.50,
    TRANSIT_PRESSURE: 0.35,
    HOSPITALITY_OCCUPANCY: 0.15,
  },

  // Simulation Defaults
  SIMULATION: {
    DEFAULT_TICK_MS: 5000,          // 5 real-world seconds per tick
    SIM_TIME_STEP_MINUTES: 5,        // Each tick advances simulation by 5 virtual minutes
    HISTORY_WINDOW_SNAPSHOTS: 24,    // Rolling window size for forecasting (2 hours of history)
    DB_FLUSH_INTERVAL_TICKS: 6,      // Write snapshot to MongoDB every 6 ticks (30 virtual minutes)
  },

  // Holt-Winters Forecasting Parameters
  FORECASTING: {
    ALPHA: 0.4,                     // Level smoothing factor (0 to 1)
    BETA: 0.2,                      // Trend smoothing factor (0 to 1)
    DEFAULT_HORIZON_MINUTES: 60,    // 1-hour forward prediction window
  },

  // Linear Programming Reallocation Parameters
  OPTIMIZATION: {
    TARGET_STRESS_CEILING: 75,      // Aim to bring all zones below 75 stress score
    MAX_SHUTTLE_TRANSFER: 15,       // Maximum fleet redirection per cycle
    MIN_RELIEF_PERCENTAGE: 5,       // Minimum expected benefit to trigger an action
  },
};
