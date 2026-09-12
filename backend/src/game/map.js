const { MAP_WIDTH, MAP_HEIGHT, CELL_FLOOR, CELL_WALL } = require('../config/constants');

function createMap() {
  const grid = [];

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    const row = [];
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      row.push(computeCellType(x, y));
    }
    grid.push(row);
  }

  return { width: MAP_WIDTH, height: MAP_HEIGHT, grid };
}

function computeCellType(x, y) {
  const isBorder = x === 0 || y === 0 || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1;
  if (isBorder) return CELL_WALL;

  const isPillar = x % 2 === 0 && y % 2 === 0;
  if (isPillar) return CELL_WALL;

  return CELL_FLOOR;
}

function isInBounds(map, x, y) {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

function isWall(map, x, y) {
  if (!isInBounds(map, x, y)) return true; // treat out-of-bounds as blocked
  return map.grid[y][x] === CELL_WALL;
}

function isFloor(map, x, y) {
  return isInBounds(map, x, y) && map.grid[y][x] === CELL_FLOOR;
}

// Starting corners are kept clear of pillars so players never spawn inside a wall.
function getSpawnPoints() {
  return [
    { x: 1, y: 1 },
    { x: MAP_WIDTH - 2, y: 1 },
    { x: 1, y: MAP_HEIGHT - 2 },
    { x: MAP_WIDTH - 2, y: MAP_HEIGHT - 2 },
  ];
}

module.exports = { createMap, isInBounds, isWall, isFloor, getSpawnPoints };
