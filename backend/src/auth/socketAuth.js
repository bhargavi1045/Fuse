const authService = require('./auth.service');
const { getTokenFromCookieHeader } = require('./authCookie');

function socketAuth(socket, next) {
  const token =
    getTokenFromCookieHeader(socket.handshake.headers.cookie) ||
    (socket.handshake.auth && socket.handshake.auth.token) ||
    (socket.handshake.headers.authorization || '').split(' ')[1];

  if (!token) {
    return next(new Error('Authentication token missing'));
  }

  try {
    const payload = authService.verifyToken(token);
    socket.user = { id: payload.sub, username: payload.username };
    return next();
  } catch (err) {
    return next(new Error('Invalid or expired token'));
  }
}

module.exports = socketAuth;
