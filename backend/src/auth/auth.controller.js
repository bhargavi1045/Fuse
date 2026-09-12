const authService = require('./auth.service');
const { setAuthCookie, clearAuthCookie } = require('./authCookie');

async function registerHandler(req, res) {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register({ username, email, password });
    setAuthCookie(res, result.token);
    return res.status(201).json({ user: result.user });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      error: status >= 500 ? 'Registration failed' : err.message,
    });
  }
}

async function loginHandler(req, res) {
  try {
    const { username, password } = req.body;
    const result = await authService.login({ username, password });
    setAuthCookie(res, result.token);
    return res.status(200).json({ user: result.user });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({
      error: status >= 500 ? 'Login failed' : err.message,
    });
  }
}

async function meHandler(req, res) {
  const User = require('../models/User');
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  return res.status(200).json({ user: user.toSafeJSON() });
}

function logoutHandler(req, res) {
  clearAuthCookie(res);
  return res.status(204).send();
}

module.exports = { registerHandler, loginHandler, meHandler, logoutHandler };
