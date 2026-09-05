const mongoose = require('mongoose');

/**
 * Connect to MongoDB with fail-safe error handling.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowdpulse';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Warning] MongoDB connection failed: ${error.message}`);
    console.warn('[Database Warning] Continuing in in-memory simulation mode.');
    return null;
  }
}

module.exports = connectDB;
