const socketAuth = require('../auth/socketAuth');
const registerConnectionHandlers = require('./handlers/connection.handlers');
const registerRoomHandlers = require('./handlers/room.handlers');
const registerGameHandlers = require('./handlers/game.handlers');
const logger = require('../utils/logger');

function initSockets(io) {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.user.username})`);

    socket.data = socket.data || {};

    registerConnectionHandlers(io, socket);
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
  });

  return io;
}

module.exports = initSockets;
