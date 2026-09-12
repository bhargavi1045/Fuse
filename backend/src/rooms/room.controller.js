const roomManager = require('./roomManager');

function createRoomHandler(req, res) {
  const hostUserId = req.user.id;
  const room = roomManager.createRoom(hostUserId);
  return res.status(201).json(room.toPublicInfo());
}

function listRoomsHandler(req, res) {
  return res.status(200).json(roomManager.listRoomsForUser(req.user.id));
}

function getRoomHandler(req, res) {
  const { roomId } = req.params;
  const room = roomManager.getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  return res.status(200).json(room.toPublicInfo());
}

module.exports = { createRoomHandler, listRoomsHandler, getRoomHandler };
