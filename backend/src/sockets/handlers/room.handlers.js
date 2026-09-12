const roomManager = require('../../rooms/roomManager');
const logger = require('../../utils/logger');

function registerRoomHandlers(io, socket) {
  socket.on('JOIN_ROOM', ({ roomId } = {}) => {
    try {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        return socket.emit('ERROR', { message: 'Room not found' });
      }

      const playerId = socket.user.id;
      const isReconnect = room.hasPlayer(playerId);

      if (!isReconnect && room.isFull()) {
        return socket.emit('ERROR', { message: 'Room is full' });
      }

      socket.join(roomId);
      room.setBroadcast((event, payload) => io.to(roomId).emit(event, payload));

      if (isReconnect) {
        room.reconnectPlayer(playerId, socket.id);
        logger.info(`Player ${playerId} reconnected to room ${roomId}`);
      } else {
        room.addPlayer({
          playerId,
          userId: playerId,
          username: socket.user.username,
          socketId: socket.id,
        });
      }

      socket.data.roomId = roomId;
      socket.data.playerId = playerId;

      socket.emit('GAME_STATE', room.getSnapshot());
      io.to(roomId).emit('GAME_STATE', room.getSnapshot());

      if (room.status === 'waiting' && room.playerCount >= 2) {
        room.startGame();
        io.to(roomId).emit('GAME_STATE', room.getSnapshot());
      }
    } catch (err) {
      socket.emit('ERROR', { message: err.message || 'Failed to join room' });
    }
  });

  socket.on('LEAVE_ROOM', () => {
    const { roomId, playerId } = socket.data || {};
    if (!roomId || !playerId) return;

    const room = roomManager.getRoom(roomId);
    if (room) {
      room.removePlayer(playerId);
      io.to(roomId).emit('GAME_STATE', room.getSnapshot());
      roomManager.cleanupIfEmpty(roomId);
    }

    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.playerId = null;
  });
}

module.exports = registerRoomHandlers;
