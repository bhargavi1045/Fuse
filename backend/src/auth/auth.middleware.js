const authService = require('./auth.service');
const { getTokenFromCookieHeader } = require('./authCookie');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  const authToken = scheme === 'Bearer' && token
    ? token
    : getTokenFromCookieHeader(req.headers.cookie);

  if (!authToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = authService.verifyToken(authToken);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
