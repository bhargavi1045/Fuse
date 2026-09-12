const { MAX_BOMBS_PER_PLAYER } = require('../config/constants');
const { isWall, isInBounds } = require('./map');
const { resolveMove } = require('./player');

function validateMovement(gameState, player, direction) {
  if (!player || !player.alive) {
    return { valid: false, reason: 'Player is not alive' };
  }

  const destination = resolveMove(player, direction);
  if (!destination) {
    return { valid: false, reason: 'Unknown direction' };
  }

  const { x, y } = destination;

  if (!isInBounds(gameState.map, x, y)) {
    return { valid: false, reason: 'Out of bounds' };
  }

  if (isWall(gameState.map, x, y)) {
    return { valid: false, reason: 'Blocked by wall' };
  }

  const bombAtDestination = Object.values(gameState.bombs).some(
    (bomb) => !bomb.exploded && bomb.x === x && bomb.y === y
  );
  if (bombAtDestination) {
    return { valid: false, reason: 'Blocked by bomb' };
  }

  return { valid: true, x, y };
}

function validateBombPlacement(gameState, player) {
  if (!player || !player.alive) {
    return { valid: false, reason: 'Player is not alive' };
  }

  const activeBombsForPlayer = Object.values(gameState.bombs).filter(
    (bomb) => bomb.ownerId === player.playerId && !bomb.exploded
  );
  if (activeBombsForPlayer.length >= MAX_BOMBS_PER_PLAYER) {
    return { valid: false, reason: 'Bomb limit reached' };
  }

  const bombAlreadyThere = Object.values(gameState.bombs).some(
    (bomb) => !bomb.exploded && bomb.x === player.x && bomb.y === player.y
  );
  if (bombAlreadyThere) {
    return { valid: false, reason: 'A bomb already occupies this cell' };
  }

  if (isWall(gameState.map, player.x, player.y)) {
    return { valid: false, reason: 'Cannot place bomb on a wall' };
  }

  return { valid: true };
}

module.exports = { validateMovement, validateBombPlacement };
