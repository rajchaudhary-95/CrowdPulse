/**
 * Forecasting Service - Pure Deterministic Logic
 * Computes projected crowd occupancy and stress index over a specified horizon.
 * Uses Holt's Double Exponential Smoothing + Event Ingress/Egress Surge Modeling.
 */

const { FORECASTING, STRESS_THRESHOLDS } = require('../config/thresholds');

/**
 * Perform Holt's Linear Exponential Smoothing on a 1D numerical array.
 * @param {number[]} series - Historical values [oldest ... newest]
 * @param {number} horizonSteps - Number of future intervals to forecast
 * @param {number} alpha - Level smoothing coefficient
 * @param {number} beta - Trend smoothing coefficient
 * @returns {number} Projected value at the target horizon
 */
function holtLinearForecast(series, horizonSteps = 6, alpha = FORECASTING.ALPHA, beta = FORECASTING.BETA) {
  if (!series || series.length === 0) return 0;
  if (series.length === 1) return series[0];

  // Initialize level and trend
  let level = series[0];
  let trend = series[1] - series[0];

  for (let i = 1; i < series.length; i++) {
    const val = series[i];
    const prevLevel = level;
    level = alpha * val + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const forecast = level + horizonSteps * trend;
  return Math.max(0, Math.round(forecast));
}

/**
 * Calculate scheduled event surge multiplier for a zone.
 * @param {string} zoneId
 * @param {Array} venues
 * @param {Date} currentTime
 * @param {number} horizonMinutes
 * @param {Object} whatIfOverrides
 * @returns {number} Additional visitor demand influx
 */
function calculateEventSurge(zoneId, venues, currentTime, horizonMinutes, whatIfOverrides = {}) {
  let surgeDemand = 0;
  const horizonEnd = new Date(currentTime.getTime() + horizonMinutes * 60 * 1000);
  const globalSurgeMultiplier = whatIfOverrides.demandSurgeMultiplier || 1.0;

  for (const venue of venues) {
    if (venue.zoneId !== zoneId) continue;

    for (const evt of venue.scheduledEvents || []) {
      const timeOffsetMinutes = whatIfOverrides.eventStartTimeDeltas?.[evt.eventId] || 0;
      const effectiveStart = new Date(new Date(evt.startTime).getTime() + timeOffsetMinutes * 60 * 1000);
      const effectiveEnd = new Date(new Date(evt.endTime).getTime() + timeOffsetMinutes * 60 * 1000);

      // Ingress Surge: Event starts within the forecast horizon
      if (effectiveStart >= currentTime && effectiveStart <= horizonEnd) {
        const timeToStartMinutes = (effectiveStart - currentTime) / (60 * 1000);
        // Surge intensity peaks 30 mins prior to kickoff
        const proximityWeight = Math.max(0.2, 1 - timeToStartMinutes / 60);
        surgeDemand += evt.ticketedAttendance * proximityWeight * 0.4 * globalSurgeMultiplier;
      }

      // Egress Surge: Event ends within the forecast horizon
      if (effectiveEnd >= currentTime && effectiveEnd <= horizonEnd) {
        surgeDemand += evt.ticketedAttendance * 0.6 * globalSurgeMultiplier;
      }
    }
  }

  return Math.round(surgeDemand);
}

/**
 * Pure function: Forecast crowd pressure across all zones.
 *
 * @param {Object} params
 * @param {Array} params.snapshots - Rolling window of past IVisitorFlowSnapshot objects
 * @param {Array} params.zones - Current zone list or Map values
 * @param {Array} params.venues - Current venue list or Map values
 * @param {Date} params.currentTime - Current simulated clock
 * @param {number} [params.horizonMinutes=60] - Forecast horizon in minutes
 * @param {Object} [params.whatIfOverrides={}] - User-adjusted what-if scenario overrides
 * @returns {Object} Forecast results per zone and system-wide projection
 */
function forecastCrowdPressure({
  snapshots = [],
  zones = [],
  venues = [],
  currentTime = new Date(),
  horizonMinutes = 60,
  whatIfOverrides = {},
}) {
  const zoneList = Array.isArray(zones) ? zones : (zones && typeof zones.values === 'function' ? Array.from(zones.values()) : []);
  const venueList = Array.isArray(venues) ? venues : (venues && typeof venues.values === 'function' ? Array.from(venues.values()) : []);

  const horizonSteps = Math.max(1, Math.round(horizonMinutes / 5)); // 5 min per step
  const zoneForecasts = {};
  let totalProjectedOccupancy = 0;
  let totalCapacity = 0;

  for (const zone of zoneList) {
    try {
      // 1. Extract historical occupancy series for this zone
      const historySeries = [];
      for (const snap of snapshots) {
        const zoneEntry = (snap.zoneSnapshots || []).find((z) => z.zoneId === zone._id);
        if (zoneEntry && typeof zoneEntry.occupancy === 'number') {
          historySeries.push(zoneEntry.occupancy);
        }
      }

      // Add current live occupancy to series
      const currentOcc = zone.liveMetrics?.currentVenueOccupancy || 0;
      historySeries.push(currentOcc);

      // 2. Compute base time-series forecast via Holt's method
      const baseForecastOccupancy = holtLinearForecast(historySeries, horizonSteps);

      // 3. Compute event-driven demand delta
      const surgeDemand = calculateEventSurge(zone._id, venueList, currentTime, horizonMinutes, whatIfOverrides);

      const maxVenueCap = zone.totalCapacity?.venue || 1;
      const projectedOccupancy = Math.min(
        Math.round(maxVenueCap * 1.2), // Upper bound 120% overflow limit
        Math.max(0, baseForecastOccupancy + surgeDemand)
      );

      // 4. Compute projected stress score
      const occupancyRatio = (projectedOccupancy / maxVenueCap) * 100;
      const transitPressure = Math.min(1.0, (zone.liveMetrics?.currentTransitPressure || 0) + (surgeDemand > 0 ? 0.15 : 0));
      const projectedStress = Math.min(100, Math.round(occupancyRatio * 0.65 + transitPressure * 100 * 0.35));

      let riskLevel = 'normal';
      if (projectedStress >= STRESS_THRESHOLDS.CRITICAL_MIN) {
        riskLevel = 'critical';
      } else if (projectedStress >= STRESS_THRESHOLDS.WARNING_MAX) {
        riskLevel = 'warning';
      } else if (projectedStress >= STRESS_THRESHOLDS.ELEVATED_MAX) {
        riskLevel = 'elevated';
      }

      const deltaOccupancy = projectedOccupancy - currentOcc;
      const deltaStress = projectedStress - (zone.liveMetrics?.compositeStressScore || 0);

      zoneForecasts[zone._id] = {
        zoneId: zone._id,
        name: zone.name,
        currentOccupancy: currentOcc,
        projectedOccupancy,
        deltaOccupancy,
        currentStress: zone.liveMetrics?.compositeStressScore || 0,
        projectedStress,
        deltaStress,
        riskLevel,
        horizonMinutes,
        surgeDemandApplied: surgeDemand,
      };

      totalProjectedOccupancy += projectedOccupancy;
      totalCapacity += maxVenueCap;
    } catch (err) {
      // Fail-Safe: Stale/fallback projection if calculation fails
      const fallbackOcc = zone.liveMetrics?.currentVenueOccupancy || 0;
      zoneForecasts[zone._id] = {
        zoneId: zone._id,
        name: zone.name,
        currentOccupancy: fallbackOcc,
        projectedOccupancy: fallbackOcc,
        deltaOccupancy: 0,
        currentStress: zone.liveMetrics?.compositeStressScore || 0,
        projectedStress: zone.liveMetrics?.compositeStressScore || 0,
        deltaStress: 0,
        riskLevel: 'normal',
        horizonMinutes,
        isFallback: true,
      };
    }
  }

  const systemProjectedStress =
    totalCapacity > 0 ? Math.min(100, Math.round((totalProjectedOccupancy / totalCapacity) * 100)) : 50;

  return {
    forecastTime: new Date(currentTime.getTime() + horizonMinutes * 60 * 1000),
    horizonMinutes,
    systemProjectedStress,
    zoneForecasts,
  };
}

module.exports = {
  forecastCrowdPressure,
  holtLinearForecast,
  calculateEventSurge,
};
