/**
 * Alert Service - Pure Deterministic Logic
 * Evaluates live zones, transit edges, and forward forecast pressures against central thresholds.
 */

const { STRESS_THRESHOLDS } = require('../config/thresholds');

/**
 * Pure function: Generate system alerts.
 *
 * @param {Object} params
 * @param {Array} params.zones - List of zones
 * @param {Array} params.transitEdges - List of transit edges
 * @param {Object} [params.forecast={}] - Forecast output from forecasting service
 * @returns {Array} List of IAlert objects
 */
function evaluateAlertRules({ zones = [], transitEdges = [], forecast = {} }) {
  const zoneList = Array.isArray(zones) ? zones : (zones && typeof zones.values === 'function' ? Array.from(zones.values()) : []);
  const edgeList = Array.isArray(transitEdges) ? transitEdges : (transitEdges && typeof transitEdges.values === 'function' ? Array.from(transitEdges.values()) : []);
  const zoneForecasts = forecast.zoneForecasts || {};

  const alerts = [];

  try {
    // 1. Evaluate Zone Live Capacity Breaches
    for (const zone of zoneList) {
      const stress = zone.liveMetrics?.compositeStressScore || 0;
      const venueCap = zone.totalCapacity?.venue || 1;
      const occ = zone.liveMetrics?.currentVenueOccupancy || 0;
      const occPct = Math.round((occ / venueCap) * 100);

      if (stress >= STRESS_THRESHOLDS.CRITICAL_MIN) {
        alerts.push({
          id: `alert-crit-${zone._id}`,
          zoneId: zone._id,
          zoneName: zone.name,
          type: 'capacity_breach',
          severity: 'critical',
          title: `CRITICAL CONGESTION: ${zone.name}`,
          message: `${zone.name} has exceeded safety threshold with a composite stress score of ${stress}%. Venue occupancy is at ${occPct}%.`,
          metrics: {
            currentVal: stress,
            thresholdVal: STRESS_THRESHOLDS.CRITICAL_MIN,
            unit: '%',
          },
          recommendedAction: 'Halt ingress turnstiles and divert incoming spectator flows to alternate fan zones.',
          timestamp: new Date(),
        });
      } else if (stress >= STRESS_THRESHOLDS.WARNING_MAX) {
        alerts.push({
          id: `alert-warn-${zone._id}`,
          zoneId: zone._id,
          zoneName: zone.name,
          type: 'capacity_breach',
          severity: 'warning',
          title: `Elevated Pressure at ${zone.name}`,
          message: `${zone.name} is approaching congestion limit (${stress}% stress index). Crowd inflow rate is accelerating.`,
          metrics: {
            currentVal: stress,
            thresholdVal: STRESS_THRESHOLDS.WARNING_MAX,
            unit: '%',
          },
          recommendedAction: 'Prepare auxiliary shuttle fleet for rapid spectator dispatch.',
          timestamp: new Date(),
        });
      }

      // 2. Evaluate Forward Predictive Surge Alerts
      const forecastItem = zoneForecasts[zone._id];
      if (forecastItem && forecastItem.projectedStress >= STRESS_THRESHOLDS.CRITICAL_MIN && stress < STRESS_THRESHOLDS.WARNING_MAX) {
        alerts.push({
          id: `alert-forecast-${zone._id}`,
          zoneId: zone._id,
          zoneName: zone.name,
          type: 'forecast_surge',
          severity: 'warning',
          title: `Forecast Surge Warning: ${zone.name}`,
          message: `Predictive model projects ${zone.name} will reach critical stress (${forecastItem.projectedStress}%) within 60 minutes due to upcoming event schedule.`,
          metrics: {
            currentVal: forecastItem.projectedStress,
            thresholdVal: STRESS_THRESHOLDS.CRITICAL_MIN,
            unit: '% (Forecast)',
          },
          recommendedAction: 'Stagger recommended attendee arrival windows via visitor mobile app.',
          timestamp: new Date(),
        });
      }
    }

    // 3. Evaluate Transit Edge Bottlenecks
    for (const edge of edgeList) {
      const util = edge.liveStatus?.utilizationRate || 0;
      const flow = edge.liveStatus?.currentFlowPerHour || 0;
      const maxCap = edge.maxThroughputPerHour || 1;

      if (util >= 0.85 || edge.liveStatus?.congestionLevel === 'heavy' || edge.liveStatus?.congestionLevel === 'gridlock') {
        const isCritical = util >= 0.95 || edge.liveStatus?.congestionLevel === 'gridlock';
        alerts.push({
          id: `alert-transit-${edge._id}`,
          zoneId: edge.fromZoneId,
          zoneName: edge.name,
          type: 'transit_bottleneck',
          severity: isCritical ? 'critical' : 'warning',
          title: `Transit Bottleneck on ${edge.name}`,
          message: `${edge.name} operating at ${Math.round(util * 100)}% capacity (${flow} / ${maxCap} passengers/hr). Travel delays accumulating.`,
          metrics: {
            currentVal: Math.round(util * 100),
            thresholdVal: 85,
            unit: '% utilization',
          },
          recommendedAction: 'Reroute pedestrian flow via adjacent skywalk and increase express bus departures.',
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  } catch (err) {
    console.error(`[Alert Service Error] ${err.message}`);
    return [];
  }
}

module.exports = {
  evaluateAlertRules,
};
