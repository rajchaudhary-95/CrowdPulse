const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { mockZones, mockVenues, mockTransitEdges } = require('./simulator/mockData');
const { getSupabase, isSupabaseConfigured } = require('./config/supabase');
const mongoose = require('mongoose');
const ZoneModel = require('./models/Zone');
const VenueModel = require('./models/Venue');
const TransitEdgeModel = require('./models/TransitEdge');
const VisitorFlowSnapshotModel = require('./models/VisitorFlowSnapshot');

async function syncAlegria() {
  console.log('⚡ Syncing Pillai Alegria dataset across databases...');

  // 1. Sync MongoDB if connected or local
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowdpulse';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    console.log(' connected to MongoDB');

    await ZoneModel.deleteMany({});
    await VenueModel.deleteMany({});
    await TransitEdgeModel.deleteMany({});
    await VisitorFlowSnapshotModel.deleteMany({});

    await ZoneModel.insertMany(mockZones);
    await VenueModel.insertMany(mockVenues);
    await TransitEdgeModel.insertMany(mockTransitEdges);
    console.log('✅ MongoDB seeded with Alegria dataset.');
    await mongoose.disconnect();
  } catch (err) {
    console.log('ℹ️ MongoDB sync skipped/notice:', err.message);
  }

  // 2. Sync Supabase PostgreSQL
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabase();
      console.log('📡 Connecting to Supabase PostgreSQL...');

      // Clear existing records in proper foreign key order
      await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('venues').delete().neq('id', 'placeholder');
      await supabase.from('transit_edges').delete().neq('id', 'placeholder');
      await supabase.from('zones').delete().neq('id', 'placeholder');

      // Insert Alegria Zones
      const supaZones = mockZones.map((z) => ({
        id: z._id,
        name: z.name,
        category: z.category,
        geo_center: z.geoCenter,
        geo_boundary: z.geoBoundary,
        total_capacity: z.totalCapacity,
        live_metrics: z.liveMetrics,
        metadata: z.metadata,
      }));
      const { error: errZ } = await supabase.from('zones').upsert(supaZones);
      if (errZ) throw new Error(`Zones upsert error: ${errZ.message}`);
      console.log(`✅ ${supaZones.length} Alegria Zones synced to Supabase.`);

      // Insert Alegria Venues
      const supaVenues = mockVenues.map((v) => ({
        id: v._id,
        name: v.name,
        zone_id: v.zoneId,
        location: v.location,
        capacity: v.maxCapacity,
        scheduled_events: v.scheduledEvents,
      }));
      const { error: errV } = await supabase.from('venues').upsert(supaVenues);
      if (errV) throw new Error(`Venues upsert error: ${errV.message}`);
      console.log(`✅ ${supaVenues.length} Alegria Venues synced to Supabase.`);

      // Insert Alegria Transit Edges
      const supaEdges = mockTransitEdges.map((e) => ({
        id: e._id,
        source_zone_id: e.fromZoneId,
        target_zone_id: e.toZoneId,
        mode: e.mode,
        capacity_per_hour: e.maxThroughputPerHour,
        current_flow_rate: e.liveStatus?.currentFlowPerHour || 0,
        congestion_index: e.liveStatus?.utilizationRate || 0,
        status: e.liveStatus?.congestionLevel || 'optimal',
        polyline: e.pathCoordinates,
      }));
      const { error: errE } = await supabase.from('transit_edges').upsert(supaEdges);
      if (errE) throw new Error(`Edges upsert error: ${errE.message}`);
      console.log(`✅ ${supaEdges.length} Alegria Transit Edges synced to Supabase.`);

      console.log('🎉 Supabase PostgreSQL fully updated with Pillai Alegria dataset!');
    } catch (err) {
      console.error('❌ Supabase sync failed:', err.message);
    }
  }

  console.log('==================================================');
  console.log('🚀 Pillai Alegria dataset synchronization complete!');
  console.log('==================================================');
}

syncAlegria();
