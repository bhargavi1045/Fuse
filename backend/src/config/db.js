const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  await mongoose.connect(mongoUri);
  logger.info(`MongoDB connected: ${mongoUri}`);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
