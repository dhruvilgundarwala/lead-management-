const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

mongoose.connection.on('disconnected', () => console.warn('[db] MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('[db] MongoDB reconnected'));
mongoose.connection.on('error', (err) => console.error('[db] MongoDB error:', err.message));

const connectDB = async () => {
  const conn = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

const disconnectDB = () => mongoose.connection.close();

const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, disconnectDB, isDBConnected };
