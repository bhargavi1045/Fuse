module.exports = {
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'test' ? 'test-only-jwt-secret' : null),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  BCRYPT_SALT_ROUNDS: 10,

  CORS_ORIGINS: process.env.CORS_ORIGINS || 'http://localhost:5173',

  MAX_PLAYERS_PER_ROOM: 4,
  RECONNECT_GRACE_PERIOD_MS: 20000, 

  TICK_RATE: 20, 
  TICK_INTERVAL_MS: 1000 / 20,

  MAP_WIDTH: 11,
  MAP_HEIGHT: 11,

  CELL_FLOOR: 'floor',
  CELL_WALL: 'wall',

  PLAYER_START_HEALTH: 3,
  PLAYER_ELIMINATION_HEALTH: 0,
  PLAYER_MOVE_STEP: 1, 

  BOMB_FUSE_MS: 2500, 
  EXPLOSION_RANGE: 2, 
  EXPLOSION_DURATION_MS: 400, 
  MAX_BOMBS_PER_PLAYER: 1,

  GAME_STATUS: {
    WAITING: 'waiting',
    IN_PROGRESS: 'in_progress',
    FINISHED: 'finished',
  },
};
