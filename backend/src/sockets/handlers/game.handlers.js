const roomManager = require('../../rooms/roomManager');

function registerGameHandlers(io, socket) {
  socket.on('PLAYER_INPUT', ({ direction } = {}) => {
    const room = getCurrentRoom(socket);
    if (!room) return socket.emit('ERROR', { message: 'Not in a room' });

    room.gameLoop.enqueueInput({
      playerId: socket.data.playerId,
      type: room.gameLoop.INPUT_TYPES.MOVE,
      direction,
    });
  });

  socket.on('PLACE_BOMB', () => {
    const room = getCurrentRoom(socket);
    if (!room) return socket.emit('ERROR', { message: 'Not in a room' });

    room.gameLoop.enqueueInput({
      playerId: socket.data.playerId,
      type: room.gameLoop.INPUT_TYPES.PLACE_BOMB,
    });
  });
}

function getCurrentRoom(socket) {
  const { roomId } = socket.data || {};
  if (!roomId) return null;
  return roomManager.getRoom(roomId);
}

module.exports = registerGameHandlers;
