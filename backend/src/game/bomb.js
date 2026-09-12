const {
  BOMB_FUSE_MS,
  EXPLOSION_RANGE,
} = require('../config/constants');
const { isWall } = require('./map');

function createBomb({ bombId, ownerId, x, y, plantedAt }) {
  return {
    bombId,
    ownerId,
    x,
    y,
    plantedAt,
    explodeAt: plantedAt + BOMB_FUSE_MS,
    exploded: false,
  };
}

function isDueToExplode(bomb, now) {
  return !bomb.exploded && now >= bomb.explodeAt;
}

function calculateExplosionCells(map, bomb) {
  const cells = [{ x: bomb.x, y: bomb.y }];

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  directions.forEach(({ dx, dy }) => {
    for (let step = 1; step <= EXPLOSION_RANGE; step += 1) {
      const x = bomb.x + dx * step;
      const y = bomb.y + dy * step;

      if (isWall(map, x, y)) break; // walls block and stop propagation

      cells.push({ x, y });
    }
  });

  return cells;
}

module.exports = { createBomb, isDueToExplode, calculateExplosionCells };
