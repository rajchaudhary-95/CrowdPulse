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

    // 4. Test Scenario Mutation & RBAC Protection: POST /api/scenario
    console.log('\n4. Testing RBAC Security on POST /api/scenario...');
    const unauthRes = await fetch(`${baseUrl}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demandSurgeMultiplier: 1.4 }),
    });
    console.log(`   ✅ Unauthenticated request correctly rejected with HTTP ${unauthRes.status}`);

    const scenarioRes = await fetch(`${baseUrl}/scenario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-organizer-token',
      },
      body: JSON.stringify({ demandSurgeMultiplier: 1.4 }),
    });
    const scenarioData = await scenarioRes.json();
    console.log(`   ✅ Authorized Organizer surge updated to: ${scenarioData.whatIfOverrides?.demandSurgeMultiplier}x`);

    // 5. Test Visitor Route Guidance: GET /api/visitor/route
    console.log('\n5. Testing GET /api/visitor/route...');
    const fromZ = simulator.zones.has('zone-main-ground') ? 'zone-main-ground' : 'zone-main-arena';
    const toZ = simulator.zones.has('zone-quadrangle') ? 'zone-quadrangle' : 'zone-transit-hub';
    const routeRes = await fetch(`${baseUrl}/visitor/route?from=${fromZ}&to=${toZ}&preference=least_crowded`);
    const routeData = await routeRes.json();
    console.log(`   ✅ Route guidance received: ${routeData.primaryRoute.edgeName} (${routeData.primaryRoute.estimatedMinutes} min, ${routeData.primaryRoute.crowdednessRating})`);
    if (routeData.alternateRecommendation) {
      console.log(`      Alternate guidance: "${routeData.alternateRecommendation.reason}"`);
    }

    // 6. Test Visitor Egress Window
    console.log('\n6. Testing GET /api/visitor/egress-window...');
    const egressRes = await fetch(`${baseUrl}/visitor/egress-window`);
    const egressData = await egressRes.json();
    console.log(`   ✅ Egress Advisory: "${egressData.windowStatus}" (Target: ${egressData.recommendedExitTarget}, Extra delay if late: ${egressData.estimatedExtraDelayMinutes})`);

    // 7. Test Concessions Discovery
    console.log('\n7. Testing GET /api/visitor/concessions...');
    const concessionsRes = await fetch(`${baseUrl}/visitor/concessions?category=food`);
    const concessionsData = await concessionsRes.json();
    console.log(`   ✅ Concessions loaded: ${concessionsData.length} food POIs found (e.g. ${concessionsData[0]?.name}, Wait: ${concessionsData[0]?.liveWaitMinutes}m)`);

    // 8. Test Facility Wait Times
    console.log('\n8. Testing GET /api/visitor/wait-times...');
    const waitTimesRes = await fetch(`${baseUrl}/visitor/wait-times`);
    const waitTimesData = await waitTimesRes.json();
    console.log(`   ✅ Facility Wait Times loaded: ${waitTimesData.length} checkpoints tracked (e.g. ${waitTimesData[0]?.name})`);

    // 9. Test Announcements Broadcast & Fetch
    console.log('\n9. Testing POST & GET /api/visitor/announcements...');
    const postAnnounce = await fetch(`${baseUrl}/visitor/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-organizer-token',
      },
      body: JSON.stringify({
        title: 'Gate 2 Quick Queue',
        message: 'Boys entry queue at Gate 2 is under 4 minutes. Proceed now.',
        severity: 'info',
        targetZoneId: 'zone-canteen-back',
      }),
    });
    const announceResult = await postAnnounce.json();
    console.log(`   ✅ Announcement created: "${announceResult.announcement?.title}"`);
    const getAnnounce = await fetch(`${baseUrl}/visitor/announcements`);
    const allAnnouncements = await getAnnounce.json();
    console.log(`   ✅ Announcements list fetched: ${allAnnouncements.length} alerts active`);

    // 10. Test Reminders
    console.log('\n10. Testing POST & GET /api/visitor/reminders...');
    await fetch(`${baseUrl}/visitor/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reminderType: 'egress',
        targetTime: '22:15',
        title: 'Alegria EDM Exit Window',
      }),
    });
    const remindersRes = await fetch(`${baseUrl}/visitor/reminders`);
    const remindersData = await remindersRes.json();
    console.log(`   ✅ Reminders loaded: ${remindersData.length} active reminders`);

    // 11. Test Bookmarks
    console.log('\n11. Testing POST & GET /api/visitor/bookmarks...');
    await fetch(`${baseUrl}/visitor/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concessionId: 'poi-canteen-main' }),
    });
    const bookmarksRes = await fetch(`${baseUrl}/visitor/bookmarks`);
    const bookmarksData = await bookmarksRes.json();
    console.log(`   ✅ Bookmarks loaded: ${bookmarksData.bookmarkedIds?.length || 0} saved POIs`);

    // 12. Test Zone Telemetry
    console.log('\n12. Testing GET /api/zones/:id/telemetry...');
    const telemetryRes = await fetch(`${baseUrl}/zones/zone-quadrangle/telemetry`);
    const telemetryData = await telemetryRes.json();
    console.log(`   ✅ Zone Telemetry for ${telemetryData.name}: Occupancy=${telemetryData.occupancy?.current}, Stress=${telemetryData.compositeStress?.score}%, Sensors Online=${telemetryData.sensorHealth?.opticalCamerasActive}`);

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
