const Room = require('./Room');
const { generateId } = require('../utils/idGenerator');
const logger = require('../utils/logger');
const rooms = new Map();

function createRoom(hostUserId) {
  const roomId = generateId('room');
  const room = new Room({ roomId, hostUserId });
  rooms.set(roomId, room);
  logger.info(`Room ${roomId} created by ${hostUserId}`);
  return room;
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function listRooms() {
  return Array.from(rooms.values()).map((room) => room.toPublicInfo());
}

function listRoomsForUser(userId) {
  return Array.from(rooms.values())
    .filter((room) => room.hostUserId === userId || room.hasPlayer(userId))
    .map((room) => room.toPublicInfo());
}

function deleteRoom(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.stopGame();
  }
  rooms.delete(roomId);
}

/**
 * Removes a room if it has no players left. Called after a player leaves
 * or a disconnect grace period expires, so empty rooms don't leak memory.
 */
function cleanupIfEmpty(roomId) {
  const room = rooms.get(roomId);
  if (room && room.playerCount === 0) {
    deleteRoom(roomId);
    logger.info(`Room ${roomId} removed (empty)`);
  }
}

function reset() {
  rooms.forEach((room) => room.stopGame());
  rooms.clear();
}

module.exports = { createRoom, getRoom, listRooms, listRoomsForUser, deleteRoom, cleanupIfEmpty, reset };
