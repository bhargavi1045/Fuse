const map = require('../src/game/map');
const { createPlayer, resolveMove, applyDamage } = require('../src/game/player');
const { createBomb, isDueToExplode, calculateExplosionCells } = require('../src/game/bomb');
const validation = require('../src/game/validation');
const gameState = require('../src/game/gameState');
const { createGameLoop } = require('../src/game/gameLoop');
const { GAME_STATUS, PLAYER_START_HEALTH } = require('../src/config/constants');

describe('map', () => {
  test('border cells are always walls', () => {
    const m = map.createMap();
    expect(map.isWall(m, 0, 0)).toBe(true);
    expect(map.isWall(m, m.width - 1, 0)).toBe(true);
    expect(map.isWall(m, 0, m.height - 1)).toBe(true);
  });

  test('spawn points are floor, not walls', () => {
    const m = map.createMap();
    map.getSpawnPoints().forEach((p) => {
      expect(map.isWall(m, p.x, p.y)).toBe(false);
    });
  });

  test('out of bounds cells are treated as walls', () => {
    const m = map.createMap();
    expect(map.isWall(m, -1, 0)).toBe(true);
    expect(map.isWall(m, 0, 999)).toBe(true);
  });
});

describe('player', () => {
  test('createPlayer sets starting health and alive state', () => {
    const p = createPlayer({ playerId: 'p1', userId: 'u1', username: 'Alice', x: 1, y: 1 });
    expect(p.health).toBe(PLAYER_START_HEALTH);
    expect(p.alive).toBe(true);
  });

  test('resolveMove computes destination without mutating player', () => {
    const p = createPlayer({ playerId: 'p1', userId: 'u1', username: 'Alice', x: 1, y: 1 });
    const dest = resolveMove(p, 'right');
    expect(dest).toEqual({ x: 2, y: 1 });
    expect(p.x).toBe(1); // unchanged
  });

  test('applyDamage eliminates player at zero health', () => {
    const p = createPlayer({ playerId: 'p1', userId: 'u1', username: 'Alice', x: 1, y: 1 });
    for (let i = 0; i < PLAYER_START_HEALTH; i += 1) applyDamage(p, 1);
    expect(p.health).toBe(0);
    expect(p.alive).toBe(false);
  });
});

describe('validation - movement', () => {
  let state;

  beforeEach(() => {
    state = gameState.createGameState();
    gameState.addPlayer(state, { playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });
  });

  test('valid movement onto floor is accepted', () => {
    const player = gameState.getPlayer(state, 'p1');
    const result = validation.validateMovement(state, player, 'right');
    expect(result.valid).toBe(true);
  });

  test('movement into a wall is rejected', () => {
    const player = gameState.getPlayer(state, 'p1');
    player.x = 1;
    player.y = 1;
    const result = validation.validateMovement(state, player, 'left');
    expect(result.valid).toBe(false);
  });

  test('movement is rejected for a dead player', () => {
    const player = gameState.getPlayer(state, 'p1');
    player.alive = false;
    const result = validation.validateMovement(state, player, 'right');
    expect(result.valid).toBe(false);
  });

  test('movement onto a bomb cell is rejected', () => {
    const player = gameState.getPlayer(state, 'p1');
    gameState.addBomb(state, createBomb({ bombId: 'b1', ownerId: 'p1', x: player.x + 1, y: player.y, plantedAt: Date.now() }));
    const result = validation.validateMovement(state, player, 'right');
    expect(result.valid).toBe(false);
  });
});

describe('validation - bomb placement', () => {
  let state;

  beforeEach(() => {
    state = gameState.createGameState();
    gameState.addPlayer(state, { playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });
  });

  test('valid bomb placement is accepted', () => {
    const player = gameState.getPlayer(state, 'p1');
    const result = validation.validateBombPlacement(state, player);
    expect(result.valid).toBe(true);
  });

  test('bomb limit prevents placing a second bomb', () => {
    const player = gameState.getPlayer(state, 'p1');
    gameState.addBomb(state, createBomb({ bombId: 'b1', ownerId: 'p1', x: player.x, y: player.y, plantedAt: Date.now() }));
    const result = validation.validateBombPlacement(state, player);
    expect(result.valid).toBe(false);
  });
});

describe('bomb timing and explosion propagation', () => {
  test('bomb is not due to explode before its fuse time', () => {
    const bomb = createBomb({ bombId: 'b1', ownerId: 'p1', x: 1, y: 1, plantedAt: Date.now() });
    expect(isDueToExplode(bomb, Date.now())).toBe(false);
  });

  test('bomb is due to explode after its fuse time', () => {
    const bomb = createBomb({ bombId: 'b1', ownerId: 'p1', x: 1, y: 1, plantedAt: Date.now() - 100000 });
    expect(isDueToExplode(bomb, Date.now())).toBe(true);
  });

  test('explosion propagation is blocked by walls', () => {
    const m = map.createMap();
    const bomb = createBomb({ bombId: 'b1', ownerId: 'p1', x: 1, y: 1, plantedAt: Date.now() });
    const cells = calculateExplosionCells(m, bomb);

    cells.forEach((cell) => {
      expect(map.isWall(m, cell.x, cell.y)).toBe(false);
    });

    expect(cells.some((c) => c.x === 1 && c.y === 1)).toBe(true);
  });
});

describe('gameState - damage and elimination', () => {
  test('applyExplosionDamage damages and eliminates players standing on affected cells', () => {
    const state = gameState.createGameState();
    const player = gameState.addPlayer(state, { playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });

    const eliminated = gameState.applyExplosionDamage(state, [{ x: player.x, y: player.y }], PLAYER_START_HEALTH);
    expect(player.alive).toBe(false);
    expect(eliminated).toContain('p1');
  });

  test('applyExplosionDamage leaves the bomb owner unharmed when immune', () => {
    const state = gameState.createGameState();
    const owner = gameState.addPlayer(state, { playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });

    const eliminated = gameState.applyExplosionDamage(
      state,
      [{ x: owner.x, y: owner.y }],
      PLAYER_START_HEALTH,
      owner.playerId
    );

    expect(owner.health).toBe(PLAYER_START_HEALTH);
    expect(owner.alive).toBe(true);
    expect(eliminated).toEqual([]);
  });

  test('computeGameOverResult declares a winner when one player remains', () => {
    const state = gameState.createGameState();
    state.status = GAME_STATUS.IN_PROGRESS;
    const p1 = gameState.addPlayer(state, { playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });
    const p2 = gameState.addPlayer(state, { playerId: 'p2', userId: 'u2', username: 'Bob', socketId: 's2' });

    p2.alive = false;

    const result = gameState.computeGameOverResult(state);
    expect(result.isOver).toBe(true);
    expect(result.winner).toBe(p1.playerId);
  });
});

describe('gameLoop - tick processes inputs deterministically', () => {
  test('MOVE input applied validly moves the player on tick', () => {
    const state = gameState.createGameState();
    state.status = GAME_STATUS.IN_PROGRESS;
    gameState.addPlayer(state, { playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });

    const loop = createGameLoop(state, { onBroadcast: () => {} });
    const player = gameState.getPlayer(state, 'p1');
    const startX = player.x;

    loop.enqueueInput({ playerId: 'p1', type: loop.INPUT_TYPES.MOVE, direction: 'right' });
    loop.tick();

    expect(player.x).toBe(startX + 1);
  });

  test('PLACE_BOMB input creates a bomb owned by the player', () => {
    const state = gameState.createGameState();
    state.status = GAME_STATUS.IN_PROGRESS;
    gameState.addPlayer(state, { playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });

    const loop = createGameLoop(state, { onBroadcast: () => {} });
    loop.enqueueInput({ playerId: 'p1', type: loop.INPUT_TYPES.PLACE_BOMB });
    loop.tick();

    const bombs = Object.values(state.bombs);
    expect(bombs.length).toBe(1);
    expect(bombs[0].ownerId).toBe('p1');
  });

  test('exploding bomb damages an opponent while leaving its owner unharmed', () => {
    const state = gameState.createGameState();
    state.status = GAME_STATUS.IN_PROGRESS;
    const p1 = gameState.addPlayer(state, { playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });
    const p2 = gameState.addPlayer(state, { playerId: 'p2', userId: 'u2', username: 'Bob', socketId: 's2' });
    p2.x = p1.x;
    p2.y = p1.y;

    const bomb = createBomb({ bombId: 'b1', ownerId: 'p1', x: p1.x, y: p1.y, plantedAt: Date.now() - 100000 });
    gameState.addBomb(state, bomb);

    const loop = createGameLoop(state, { onBroadcast: () => {} });
    
    for (let i = 0; i < PLAYER_START_HEALTH; i += 1) {
      const b = createBomb({ bombId: `b${i}`, ownerId: 'p1', x: p1.x, y: p1.y, plantedAt: Date.now() - 100000 });
      gameState.addBomb(state, b);
      loop.tick();
    }

    expect(p1.alive).toBe(true);
    expect(p2.alive).toBe(false);
    expect(state.status).toBe(GAME_STATUS.FINISHED);
    expect(state.winner).toBe('p1');
  });
});
