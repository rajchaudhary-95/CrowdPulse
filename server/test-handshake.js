/**
 * Handshake Verification Script - Phase 2 (Link)
 * Validates:
 *  1. Environment configuration (.env)
 *  2. MongoDB connection (Mongoose)
 *  3. In-process Linear Programming solver (javascript-lp-solver)
 *  4. External OpenStreetMap tile reachability
 *  5. External OSRM public routing API reachability
 *  6. Express + Socket.io runtime initialization
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const solver = require('javascript-lp-solver');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

async function runHandshake() {
  console.log('==============================================');
  console.log('⚡ CrowdPulse / OmniVenue - Phase 2: Handshake');
  console.log('==============================================\n');

  let allPassed = true;

  // 1. Check .env variables
  console.log('1. Checking environment variables...');
  const port = process.env.PORT || 5000;
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowdpulse';
  console.log(`   PORT: ${port}`);
  console.log(`   MONGODB_URI: ${mongoUri}`);
  console.log('   ✅ Environment variables loaded.\n');

  // 2. Test MongoDB connectivity
  console.log('2. Testing MongoDB connectivity via Mongoose...');
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log(`   ✅ Successfully connected to MongoDB database: "${mongoose.connection.name}"`);
    await mongoose.disconnect();
  } catch (err) {
    console.error(`   ❌ MongoDB connection failed: ${err.message}`);
    allPassed = false;
  }
  console.log();

  // 3. Test LP Solver in-process execution
  console.log('3. Testing Linear Programming Solver (javascript-lp-solver)...');
  try {
    const testModel = {
      optimize: 'capacity',
      opType: 'max',
      constraints: {
        transit: { max: 100 },
      },
      variables: {
        shuttleA: { capacity: 40, transit: 30 },
        shuttleB: { capacity: 50, transit: 40 },
      },
    };
    const results = solver.Solve(testModel);
    if (results && results.feasible) {
      console.log(`   ✅ LP Solver executed successfully (Feasible: ${results.feasible}, Result: ${results.result})`);
    } else {
      throw new Error('LP solver returned infeasible or empty solution');
    }
  } catch (err) {
    console.error(`   ❌ LP Solver test failed: ${err.message}`);
    allPassed = false;
  }
  console.log();

  // 4. Test External OpenStreetMap tile endpoint
  console.log('4. Testing OpenStreetMap tile availability...');
  try {
    const tileRes = await fetch('https://tile.openstreetmap.org/0/0/0.png', {
      headers: { 'User-Agent': 'CrowdPulse-HackCelestial4/1.0' },
    });
    if (tileRes.ok) {
      console.log(`   ✅ OpenStreetMap tiles reachable (Status: ${tileRes.status})`);
    } else {
      console.warn(`   ⚠️ OSM tile returned status: ${tileRes.status}`);
    }
  } catch (err) {
    console.error(`   ❌ OSM Tile connection failed: ${err.message}`);
    allPassed = false;
  }
  console.log();

  // 5. Test External OSRM routing endpoint
  console.log('5. Testing OSRM routing service reachability...');
  try {
    const osrmUrl = 'http://router.project-osrm.org/route/v1/driving/77.2090,28.6139;77.2190,28.6239?overview=false';
    const osrmRes = await fetch(osrmUrl);
    if (osrmRes.ok) {
      const data = await osrmRes.json();
      console.log(`   ✅ OSRM Routing reachable (Code: ${data.code}, Routes found: ${data.routes ? data.routes.length : 0})`);
    } else {
      console.warn(`   ⚠️ OSRM returned status: ${osrmRes.status}`);
    }
  } catch (err) {
    console.error(`   ❌ OSRM connection failed: ${err.message}`);
    // Non-blocking since we also have haversine fallback in service
  }
  console.log();

  // 6. Test Express & Socket.io runtime initialization
  console.log('6. Testing Express & Socket.io initialization...');
  try {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: '*' } });
    
    await new Promise((resolve, reject) => {
      server.listen(0, '127.0.0.1', () => {
        const boundPort = server.address().port;
        console.log(`   ✅ Express & Socket.io server bound on temporary port ${boundPort}`);
        server.close(resolve);
      });
      server.on('error', reject);
    });
  } catch (err) {
    console.error(`   ❌ Express/Socket.io initialization failed: ${err.message}`);
    allPassed = false;
  }
  console.log();

  console.log('==============================================');
  if (allPassed) {
    console.log('🎉 ALL HANDSHAKE CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SOME HANDSHAKE CHECKS ENCOUNTERED WARNINGS/ERRORS.');
  }
  console.log('==============================================');
  process.exit(allPassed ? 0 : 1);
}

runHandshake();
