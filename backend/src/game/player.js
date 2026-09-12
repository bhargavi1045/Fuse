const { PLAYER_START_HEALTH } = require('../config/constants');

function createPlayer({ playerId, userId, username, x, y, socketId }) {
  return {
    playerId,
    userId,
    username,
    x,
    y,
    health: PLAYER_START_HEALTH,
    alive: true,
    connected: true,
    socketId,
    lastInputSeq: -1, // for basic per-player input ordering/dedup
  };
}

const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function resolveMove(player, direction) {
  const delta = DIRECTIONS[direction];
  if (!delta) return null;

  return {
    x: player.x + delta.dx,
    y: player.y + delta.dy,
  };
}

function applyDamage(player, amount) {
  player.health = Math.max(0, player.health - amount);
  if (player.health <= 0) {
    player.alive = false;
  }
  return player;
}

module.exports = { createPlayer, resolveMove, applyDamage, DIRECTIONS };
