const express = require('express');
const { registerHandler, loginHandler, meHandler, logoutHandler } = require('./auth.controller');
const { requireAuth } = require('./auth.middleware');

const router = express.Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.get('/me', requireAuth, meHandler);
router.post('/logout', logoutHandler);

module.exports = router;
