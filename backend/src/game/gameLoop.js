const { TICK_INTERVAL_MS, GAME_STATUS, EXPLOSION_DURATION_MS } = require('../config/constants');
const { validateMovement, validateBombPlacement } = require('./validation');
const { createBomb, isDueToExplode, calculateExplosionCells } = require('./bomb');
const {
  getPlayer,
  addBomb,
  removeBomb,
  applyExplosionDamage,
  computeGameOverResult,
  serialize,
} = require('./gameState');
const { generateId } = require('../utils/idGenerator');
const logger = require('../utils/logger');

const INPUT_TYPES = {
  MOVE: 'MOVE',
  PLACE_BOMB: 'PLACE_BOMB',
};

const DAMAGE_PER_EXPLOSION = 1;

function createGameLoop(state, { onBroadcast, onGameOver } = {}) {
  const inputQueue = [];
  let seqCounter = 0;
  let intervalHandle = null;

  function enqueueInput(input) {
    seqCounter += 1;
    inputQueue.push({ ...input, seq: seqCounter, receivedAt: Date.now() });
  }

  function drainQueue() {
    const batch = inputQueue.splice(0, inputQueue.length);
    batch.sort((a, b) => a.seq - b.seq);
    return batch;
  }

  function processInput(input) {
    const player = getPlayer(state, input.playerId);
    if (!player) return;

    if (input.type === INPUT_TYPES.MOVE) {
      const result = validateMovement(state, player, input.direction);
      if (result.valid) {
        player.x = result.x;
        player.y = result.y;
      }
      return;
    }

    if (input.type === INPUT_TYPES.PLACE_BOMB) {
      const result = validateBombPlacement(state, player);
      if (result.valid) {
        const bomb = createBomb({
          bombId: generateId('bomb'),
          ownerId: player.playerId,
          x: player.x,
          y: player.y,
          plantedAt: Date.now(),
        });
        addBomb(state, bomb);
      }
      return;
    }

    logger.warn(`Unknown input type ignored: ${input.type}`);
  }

  function updateBombsAndExplosions() {
    const now = Date.now();
    const eliminatedThisTick = [];

    Object.values(state.bombs).forEach((bomb) => {
      if (!isDueToExplode(bomb, now)) return;

      bomb.exploded = true;
      const cells = calculateExplosionCells(state.map, bomb);

      cells.forEach((cell) => {
        state.explosions.push({ x: cell.x, y: cell.y, expiresAt: now + EXPLOSION_DURATION_MS });
      });

      const eliminated = applyExplosionDamage(state, cells, DAMAGE_PER_EXPLOSION, bomb.ownerId);
      eliminatedThisTick.push(...eliminated);

      removeBomb(state, bomb.bombId);
    });

    state.explosions = state.explosions.filter((e) => e.expiresAt > now);

    return eliminatedThisTick;
  }

  function checkGameOver() {
    const result = computeGameOverResult(state);
    if (result.isOver) {
      state.status = GAME_STATUS.FINISHED;
      state.winner = result.winner;
      if (onGameOver) onGameOver(result);
    }
    return result.isOver;
  }

  function tick() {
    if (state.status !== GAME_STATUS.IN_PROGRESS) {
      return;
    }

    const inputs = drainQueue();
    inputs.forEach(processInput);

    const eliminated = updateBombsAndExplosions();

    state.tick += 1;

    const gameOver = checkGameOver();

    if (onBroadcast) {
      onBroadcast(serialize(state), { eliminated, gameOver });
    }
  }

  function start() {
    if (intervalHandle) return;
    intervalHandle = setInterval(tick, TICK_INTERVAL_MS);
  }

  function stop() {
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
  }

  return {
    INPUT_TYPES,
    enqueueInput,
    start,
    stop,
    tick,
  };
}

module.exports = { createGameLoop, INPUT_TYPES };
