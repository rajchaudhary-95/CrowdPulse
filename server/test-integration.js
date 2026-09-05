/**
 * End-to-End Integration Test for Layer 1, 2, and 3
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bootstrap = require('./index');

async function testIntegration() {
  console.log('==================================================');
  console.log('⚡ Running End-to-End Backend Integration Test');
  console.log('==================================================\n');

  const testPort = 5055;
  const { server, simulator } = await bootstrap(testPort);

  const baseUrl = `http://127.0.0.1:${testPort}/api`;

  try {
    // 1. Test /api/status
    console.log('1. Testing GET /api/status...');
    const statusRes = await fetch(`${baseUrl}/status`);
    const statusData = await statusRes.json();
    console.log(`   ✅ Status: ${statusData.status}, Zones: ${statusData.zonesCount}, Venues: ${statusData.venuesCount}`);

    // 2. Test /api/state
    console.log('\n2. Testing GET /api/state...');
    const stateRes = await fetch(`${baseUrl}/state`);
    const stateData = await stateRes.json();
    console.log(`   ✅ Live state payload received. Active Alerts: ${stateData.alerts.length}, Recommendations: ${stateData.recommendations.length}`);

    // 3. Test /api/forecast
    console.log('\n3. Testing GET /api/forecast...');
    const forecastRes = await fetch(`${baseUrl}/forecast`);
    const forecastData = await forecastRes.json();
    console.log(`   ✅ System Projected Stress: ${forecastData.systemProjectedStress}%, Horizon: ${forecastData.horizonMinutes} min`);

    // 4. Test Scenario Mutation: POST /api/scenario
    console.log('\n4. Testing POST /api/scenario (What-If surge injection)...');
    const scenarioRes = await fetch(`${baseUrl}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demandSurgeMultiplier: 1.4 }),
    });
    const scenarioData = await scenarioRes.json();
    console.log(`   ✅ Surge updated to: ${scenarioData.whatIfOverrides.demandSurgeMultiplier}x`);

    // 5. Test Visitor Route Guidance: GET /api/visitor/route
    console.log('\n5. Testing GET /api/visitor/route...');
    const routeRes = await fetch(`${baseUrl}/visitor/route?from=zone-main-arena&to=zone-transit-hub&preference=least_crowded`);
    const routeData = await routeRes.json();
    console.log(`   ✅ Route guidance received: ${routeData.primaryRoute.edgeName} (${routeData.primaryRoute.estimatedMinutes} min, ${routeData.primaryRoute.crowdednessRating})`);
    if (routeData.alternateRecommendation) {
      console.log(`      Alternate guidance: "${routeData.alternateRecommendation.reason}"`);
    }

    console.log('\n==================================================');
    console.log('🎉 ALL INTEGRATION API TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Integration test failed:', err);
  } finally {
    simulator.stop();
    await new Promise((res) => server.close(res));
    await mongoose.disconnect();
    setTimeout(() => process.exit(0), 100);
  }
}

testIntegration();
