/**
 * Optimization Service - Pure Deterministic Logic
 * Solves multi-zone crowd rebalancing and transit fleet allocation via Linear Programming.
 * Uses `javascript-lp-solver`.
 */

const solver = require('javascript-lp-solver');
const { OPTIMIZATION, STRESS_THRESHOLDS } = require('../config/thresholds');

/**
 * Pure function: Compute optimal redistribution recommendations.
 *
 * @param {Object} params
 * @param {Array} params.zones - Zone objects
 * @param {Array} params.transitEdges - TransitEdge objects
 * @param {Object} params.forecast - Output from forecasting service
 * @returns {Array} List of IReallocationRecommendation objects
 */
function computeRedistributionPlan({ zones = [], transitEdges = [], forecast = {} }) {
  const zoneList = Array.isArray(zones) ? zones : (zones && typeof zones.values === 'function' ? Array.from(zones.values()) : []);
  const edgeList = Array.isArray(transitEdges) ? transitEdges : (transitEdges && typeof transitEdges.values === 'function' ? Array.from(transitEdges.values()) : []);
  const zoneForecasts = forecast.zoneForecasts || {};

  const recommendations = [];

  try {
    // 1. Identify stressed zones (stress >= elevated max) and relief donor zones
    const stressedZones = [];
    const reliefZones = [];

    for (const zone of zoneList) {
      const forecastEntry = zoneForecasts[zone._id];
      const effectiveStress = forecastEntry?.projectedStress ?? (zone.liveMetrics?.compositeStressScore || 0);

      if (effectiveStress >= STRESS_THRESHOLDS.ELEVATED_MAX) {
        stressedZones.push({ zone, stress: effectiveStress, forecast: forecastEntry });
      } else if (effectiveStress < OPTIMIZATION.TARGET_STRESS_CEILING) {
        reliefZones.push({
          zone,
          stress: effectiveStress,
          spareCapacity: (zone.totalCapacity?.venue || 10000) - (zone.liveMetrics?.currentVenueOccupancy || 0),
        });
      }
    }

    // If no zone is elevated/stressed, generate a steady-state confirmation
    if (stressedZones.length === 0) {
      return [
        {
          id: `rec-steady-${Date.now()}`,
          generatedAt: new Date(),
          targetAudience: 'organizer',
          category: 'alternate_zone',
          title: 'System Operating Within Optimal Bounds',
          description: 'All zones and transit links are below congestion thresholds. No emergency fleet diversion needed.',
          impactEstimation: {
            estimatedStressReliefPct: 0,
            affectedVisitorCount: 0,
            etaChangeMinutes: 0,
          },
          suggestedActionPayload: {},
        },
      ];
    }

    // 2. Formulate Linear Programming Model for Shuttle Reallocation
    // Objective: Maximize relief capacity moved into corridors feeding relief zones
    // Constraints:
    //  - Total shuttles diverted cannot exceed MAX_SHUTTLE_TRANSFER
    //  - Edge max capacity
    const lpModel = {
      optimize: 'reliefEffectiveness',
      opType: 'max',
      constraints: {
        totalShuttles: { max: OPTIMIZATION.MAX_SHUTTLE_TRANSFER },
      },
      variables: {},
    };

    const eligibleEdges = edgeList.filter((e) => e.mode === 'shuttle_bus' && e.liveStatus?.isActive);

    for (const edge of eligibleEdges) {
      const isFromStressed = stressedZones.some((s) => s.zone._id === edge.fromZoneId);
      const isToRelief = reliefZones.some((r) => r.zone._id === edge.toZoneId);

      const variableKey = `dispatch_${edge._id}`;
      // Variable: how many additional shuttles to allocate to this edge
      lpModel.constraints[variableKey] = { max: 8 }; // Max 8 buses to any single line

      // Weight higher if edge directly alleviates high stress
      const weight = (isFromStressed ? 10 : 2) + (isToRelief ? 8 : 1);

      lpModel.variables[variableKey] = {
        reliefEffectiveness: weight,
        totalShuttles: 1,
        [variableKey]: 1,
      };
    }

    const lpSolution = solver.Solve(lpModel);

    // 3. Translate LP solution into concrete Operator Recommendations
    if (lpSolution && lpSolution.feasible) {
      for (const edge of eligibleEdges) {
        const busDelta = Math.round(lpSolution[`dispatch_${edge._id}`] || 0);
        if (busDelta > 0) {
          const fromZone = zoneList.find((z) => z._id === edge.fromZoneId);
          const toZone = zoneList.find((z) => z._id === edge.toZoneId);

          const relievedVisitors = busDelta * 180; // ~180 passengers per shuttle cycle
          recommendations.push({
            id: `rec-transit-${edge._id}-${Date.now()}`,
            generatedAt: new Date(),
            targetAudience: 'organizer',
            category: 'transit_reroute',
            sourceZoneId: edge.fromZoneId,
            targetZoneId: edge.toZoneId,
            title: `Deploy +${busDelta} Express Shuttles on ${edge.name}`,
            description: `Diverts crowd from high-pressure ${fromZone?.name || 'hub'} towards ${toZone?.name || 'relief zone'}. Estimated passenger clearance: ${relievedVisitors} visitors/hr.`,
            impactEstimation: {
              estimatedStressReliefPct: Math.min(25, busDelta * 3.5),
              affectedVisitorCount: relievedVisitors,
              etaChangeMinutes: -4,
            },
            suggestedActionPayload: {
              shuttleDispatchDelta: busDelta,
              edgeId: edge._id,
            },
          });
        }
      }
    }

    // 4. Generate Ingress Gating Recommendations for Critical Zones
    for (const { zone, stress } of stressedZones) {
      if (stress >= STRESS_THRESHOLDS.CRITICAL_MIN) {
        recommendations.push({
          id: `rec-gate-${zone._id}-${Date.now()}`,
          generatedAt: new Date(),
          targetAudience: 'organizer',
          category: 'surge_gate_control',
          sourceZoneId: zone._id,
          title: `Throttle Turnstile Inflow at ${zone.name}`,
          description: `Zone has breached critical threshold (${stress}% stress). Implement 25% pulsed turnstile throttling to prevent concourse crush.`,
          impactEstimation: {
            estimatedStressReliefPct: 15,
            affectedVisitorCount: 3500,
            etaChangeMinutes: 6,
          },
          suggestedActionPayload: {
            entryGateThrottlePct: 25,
            zoneId: zone._id,
          },
        });
      }
    }

    // 5. Generate Attendee/Visitor Guidance Recommendations
    const topStressed = stressedZones[0];
    const bestRelief = reliefZones.sort((a, b) => a.stress - b.stress)[0];

    if (topStressed && bestRelief) {
      recommendations.push({
        id: `rec-visitor-${Date.now()}`,
        generatedAt: new Date(),
        targetAudience: 'visitor',
        category: 'alternate_zone',
        sourceZoneId: topStressed.zone._id,
        targetZoneId: bestRelief.zone._id,
        title: `Skip the Queues: Visit ${bestRelief.zone.name}`,
        description: `Nearby ${bestRelief.zone.name} has open dining, live megascreens, and zero wait times (${bestRelief.stress}% load vs ${topStressed.stress}% at ${topStressed.zone.name}).`,
        impactEstimation: {
          estimatedStressReliefPct: 8,
          affectedVisitorCount: 1200,
          etaChangeMinutes: -12,
        },
        suggestedActionPayload: {
          recommendedArrivalWindow: 'Immediate (Next 45 min)',
          targetZoneId: bestRelief.zone._id,
        },
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5 ranked actions
  } catch (err) {
    // Fail-Safe: Return heuristic baseline if LP encountered unexpected error
    console.error(`[Optimization Service Error] ${err.message}`);
    return [
      {
        id: `rec-fallback-${Date.now()}`,
        generatedAt: new Date(),
        targetAudience: 'organizer',
        category: 'staggered_departure',
        title: 'Apply Staggered Egress Protocols',
        description: 'Automated fallback: Advise staggered exit waves for major arena concluding events.',
        impactEstimation: {
          estimatedStressReliefPct: 10,
          affectedVisitorCount: 2000,
          etaChangeMinutes: 5,
        },
        suggestedActionPayload: {},
      },
    ];
  }
}

module.exports = {
  computeRedistributionPlan,
};
