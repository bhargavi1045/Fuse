const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./auth/auth.routes');
const roomRoutes = require('./rooms/room.routes');
const { CORS_ORIGINS } = require('./config/constants');
const { requireTrustedOrigin } = require('./auth/csrf.middleware');

const allowedOrigins = CORS_ORIGINS.split(',').map((origin) => origin.trim());
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: '32kb' }));
  app.use(requireTrustedOrigin(allowedOrigins));

  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api/auth', authRateLimiter, authRoutes);
  app.use('/api/rooms', roomRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    require('./utils/logger').error(err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
