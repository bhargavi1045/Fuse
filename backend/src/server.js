require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');
const { connectDB } = require('./config/db');
const initSockets = require('./sockets');
const logger = require('./utils/logger');
const { CORS_ORIGINS, JWT_SECRET } = require('./config/constants');

function validateProductionConfig() {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGINS) {
    throw new Error('CORS_ORIGINS must be set in production');
  }
}

async function start() {
  validateProductionConfig();
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: CORS_ORIGINS.split(',').map((origin) => origin.trim()),
      credentials: true,
    },
  });

  initSockets(io);

  const port = process.env.PORT || 4000;
  httpServer.listen(port, () => {
    logger.info(`BlastZone backend listening on port ${port}`);
  });

  return { app, httpServer, io };
}

if (require.main === module) {
  start().catch((err) => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
}

module.exports = { start };
