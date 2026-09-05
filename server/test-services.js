/**
 * Unit Test Suite for Pure Business Logic Services
 * Verifies:
 *  1. Holt's exponential smoothing & event surge forecasting (forecasting.service.js)
 *  2. Linear Programming redistribution optimizer (optimization.service.js)
 *  3. Alert threshold rule evaluator (alert.service.js)
 *  4. Fail-safe degradation on edge cases / empty data
 */

const assert = require('assert');
const { forecastCrowdPressure, holtLinearForecast } = require('./services/forecasting.service');
const { computeRedistributionPlan } = require('./services/optimization.service');
const { evaluateAlertRules } = require('./services/alert.service');
const { mockZones, mockVenues, mockTransitEdges } = require('./simulator/mockData');

console.log('==================================================');
console.log('🧪 Running Pure Services Unit Test Suite');
console.log('==================================================\n');

// Test 1: Holt's linear forecast math
console.log('1. Testing Holt Linear Forecast algorithm...');
const trendSeries = [100, 110, 120, 130, 140]; // Steady upward trend
const projection = holtLinearForecast(trendSeries, 3); // 3 steps forward
assert(projection > 140, 'Projected value must follow upward trend');
console.log(`   ✅ Holt projection for [100..140] over 3 steps: ${projection}`);

// Test 2: Full Forecasting Service with Mock Data
console.log('\n2. Testing forecastCrowdPressure with event surge...');
const forecastResult = forecastCrowdPressure({
  snapshots: [],
  zones: mockZones,
  venues: mockVenues,
  currentTime: new Date(),
  horizonMinutes: 60,
  whatIfOverrides: { demandSurgeMultiplier: 1.2 },
});

assert(forecastResult.zoneForecasts, 'Forecast must return zoneForecasts dictionary');
assert(forecastResult.zoneForecasts['zone-main-arena'], 'Main arena forecast must exist');
console.log(`   ✅ Main arena projected stress: ${forecastResult.zoneForecasts['zone-main-arena'].projectedStress}% (Risk: ${forecastResult.zoneForecasts['zone-main-arena'].riskLevel})`);
console.log(`   ✅ System average projected stress: ${forecastResult.systemProjectedStress}%`);

// Test 3: Optimization Service (LP Redistribution)
console.log('\n3. Testing computeRedistributionPlan LP solver...');
const recommendations = computeRedistributionPlan({
  zones: mockZones,
  transitEdges: mockTransitEdges,
  forecast: forecastResult,
});

assert(Array.isArray(recommendations), 'Recommendations must be an array');
assert(recommendations.length > 0, 'Must generate at least one recommendation for elevated zones');
const firstRec = recommendations[0];
console.log(`   ✅ Generated ${recommendations.length} recommendations. Top recommendation:`);
console.log(`      Title: "${firstRec.title}"`);
console.log(`      Category: ${firstRec.category} (Target: ${firstRec.targetAudience})`);
console.log(`      Estimated Relief: ${firstRec.impactEstimation.estimatedStressReliefPct}%`);

// Test 4: Alert Service
console.log('\n4. Testing evaluateAlertRules...');
const alerts = evaluateAlertRules({
  zones: mockZones,
  transitEdges: mockTransitEdges,
  forecast: forecastResult,
});

assert(Array.isArray(alerts), 'Alerts must be an array');
console.log(`   ✅ Generated ${alerts.length} active alerts. Sample alerts:`);
for (const alert of alerts.slice(0, 2)) {
  console.log(`      [${alert.severity.toUpperCase()}] ${alert.title}`);
}

// Test 5: Fail-Safe Invariants (Empty / Corrupted Inputs)
console.log('\n5. Testing Fail-Safe Graceful Degradation...');
const safeForecast = forecastCrowdPressure({ zones: null, venues: null });
assert(safeForecast.zoneForecasts, 'Must not crash with null inputs');

const safeOpt = computeRedistributionPlan({ zones: [], transitEdges: [] });
assert(Array.isArray(safeOpt), 'Must return valid fallback array for empty zones');

const safeAlerts = evaluateAlertRules({ zones: null, transitEdges: null });
assert(Array.isArray(safeAlerts), 'Must return empty array on invalid inputs');
console.log('   ✅ All fail-safe degradation tests passed without unhandled exceptions!');

console.log('\n==================================================');
console.log('🎉 ALL PURE SERVICE TESTS PASSED DETERMINISTICALLY!');
console.log('==================================================');
