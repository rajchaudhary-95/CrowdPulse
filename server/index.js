const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const createApiRoutes = require('./routes/api.routes');
const CrowdSimulator = require('./simulator/crowdSimulator');

const DEFAULT_PORT = process.env.PORT || 5000;

async function bootstrap(customPort = null) {
  const portToUse = customPort || DEFAULT_PORT;
  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Connect to Database
  await connectDB();

  // Instantiate Simulator
  const simulator = new CrowdSimulator(io);
  await simulator.initialize();
  simulator.start(parseInt(process.env.TICK_INTERVAL_MS, 10) || 5000);

  // Mount REST API
  app.use('/api', createApiRoutes(simulator));

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'CrowdPulse / OmniVenue API',
      status: 'operational',
      simulatedTime: simulator.simulatedTime,
      docs: '/api/status',
    });
  });

  // Socket.io Real-Time Connection Handling
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Send initial snapshot immediately to the newly connected client
    socket.emit('live:tick', simulator.getClientPayload());

    // Scenario What-If Update from Client
    socket.on('scenario:update', (overrides) => {
      const updated = simulator.updateScenario(overrides);
      io.emit('scenario:changed', updated);
    });

    // Reset Scenario
    socket.on('scenario:reset', () => {
      const reset = simulator.resetScenario();
      io.emit('scenario:changed', reset);
    });

    // Visitor Route Request
    socket.on('visitor:requestRoute', (data) => {
      const { from, to, preference } = data || {};
      if (from && to) {
        const routeData = simulator.findOptimalRoute(from, to, preference);
        socket.emit('visitor:routeResponse', routeData);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Start Server
  await new Promise((resolve) => {
    server.listen(portToUse, () => {
      console.log(`🚀 CrowdPulse Server running at http://localhost:${portToUse}`);
      console.log(`📡 WebSocket ready on ws://localhost:${portToUse}`);
      resolve();
    });
  });

  return { app, server, simulator, io };
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('Fatal bootstrap error:', err);
    process.exit(1);
  });
}

module.exports = bootstrap;
