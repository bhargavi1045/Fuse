const roomManager = require('../../rooms/roomManager');
const logger = require('../../utils/logger');

function registerConnectionHandlers(io, socket) {
  socket.on('disconnect', () => {
    const { roomId, playerId } = socket.data || {};
    if (!roomId || !playerId) return;

    const room = roomManager.getRoom(roomId);
    if (!room) return;

    logger.info(`Player ${playerId} disconnected from room ${roomId}, starting grace period`);

    room.disconnectPlayer(playerId, {
      onExpire: (expiredPlayerId) => {
        logger.info(`Grace period expired for ${expiredPlayerId} in room ${roomId}`);
        io.to(roomId).emit('GAME_STATE', room.getSnapshot());
        roomManager.cleanupIfEmpty(roomId);
      },
    });

    io.to(roomId).emit('GAME_STATE', room.getSnapshot());
  });
}

module.exports = registerConnectionHandlers;
