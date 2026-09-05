const mongoose = require('mongoose');
const { isSupabaseConfigured, testSupabaseConnection } = require('./supabase');

/**
 * Unified Database Initializer supporting Supabase PostgreSQL and MongoDB with fail-safe fallback.
 */
async function connectDB() {
  const provider = (process.env.DB_PROVIDER || (isSupabaseConfigured() ? 'supabase' : 'mongodb')).toLowerCase();

  if (provider === 'supabase' && isSupabaseConfigured()) {
    console.log('[Database] Connecting to Supabase PostgreSQL...');
    const result = await testSupabaseConnection();
    if (result.connected) {
      console.log(`[Database] Supabase Connected: ${result.message}`);
      return { provider: 'supabase', status: 'connected' };
    } else {
      console.warn(`[Database Warning] Supabase connection issue: ${result.message}`);
      console.warn('[Database Warning] Falling back to MongoDB / In-memory mode.');
    }
  }

  // Fallback / standard MongoDB
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowdpulse';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return { provider: 'mongodb', conn };
  } catch (error) {
    console.error(`[Database Warning] MongoDB connection failed: ${error.message}`);
    console.warn('[Database Warning] Running in high-performance in-memory simulation mode.');
    return { provider: 'in-memory', status: 'active' };
  }
}

module.exports = connectDB;
