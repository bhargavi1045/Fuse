const {
  MAX_PLAYERS_PER_ROOM,
  RECONNECT_GRACE_PERIOD_MS,
  GAME_STATUS,
} = require('../config/constants');
const gameState = require('../game/gameState');
const { createGameLoop } = require('../game/gameLoop');
const logger = require('../utils/logger');

class Room {
  constructor({ roomId, hostUserId, broadcast }) {
    this.roomId = roomId;
    this.hostUserId = hostUserId;
    this.broadcast = broadcast || (() => {});
    this.status = GAME_STATUS.WAITING;
    this.state = gameState.createGameState();
    this.disconnectTimers = new Map(); // playerId -> timeout handle

    this.gameLoop = createGameLoop(this.state, {
      onBroadcast: (snapshot, meta) => {
        this.broadcast('GAME_STATE', snapshot);

        if (meta.eliminated && meta.eliminated.length > 0) {
          meta.eliminated.forEach((playerId) => {
            this.broadcast('PLAYER_ELIMINATED', { playerId });
          });
        }

        if (meta.gameOver) {
          this.status = GAME_STATUS.FINISHED;
          this.broadcast('GAME_OVER', { winner: this.state.winner });
        }
      },
      onGameOver: () => {
        this.gameLoop.stop();
      },
    });
  }

  setBroadcast(broadcastFn) {
    this.broadcast = broadcastFn;
  }

  get playerCount() {
    return Object.keys(this.state.players).length;
  }

  isFull() {
    return this.playerCount >= MAX_PLAYERS_PER_ROOM;
  }

  hasPlayer(playerId) {
    return !!gameState.getPlayer(this.state, playerId);
  }

  addPlayer({ playerId, userId, username, socketId }) {
    if (this.hasPlayer(playerId)) {
      return gameState.getPlayer(this.state, playerId);
    }

    if (this.isFull()) {
      throw new Error('Room is full');
    }

    const player = gameState.addPlayer(this.state, { playerId, userId, username, socketId });
    logger.info(`Player ${username} joined room ${this.roomId}`);
    return player;
  }

  removePlayer(playerId) {
    this._clearDisconnectTimer(playerId);
    gameState.removePlayer(this.state, playerId);
  }

  disconnectPlayer(playerId, { onExpire } = {}) {
    gameState.markPlayerDisconnected(this.state, playerId);
    this._clearDisconnectTimer(playerId);

    const timer = setTimeout(() => {
      this.disconnectTimers.delete(playerId);
      this.removePlayer(playerId);
      if (onExpire) onExpire(playerId);
    }, RECONNECT_GRACE_PERIOD_MS);

    this.disconnectTimers.set(playerId, timer);
  }

  reconnectPlayer(playerId, socketId) {
    this._clearDisconnectTimer(playerId);
    return gameState.reconnectPlayer(this.state, playerId, socketId);
  }

  _clearDisconnectTimer(playerId) {
    const timer = this.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(playerId);
    }
  }

  startGame() {
    if (this.status === GAME_STATUS.IN_PROGRESS) return;
    this.status = GAME_STATUS.IN_PROGRESS;
    this.state.status = GAME_STATUS.IN_PROGRESS;
    this.gameLoop.start();
    logger.info(`Room ${this.roomId} game started`);
  }

  stopGame() {
    this.gameLoop.stop();
  }

  getSnapshot() {
    return gameState.serialize(this.state);
  }

  toPublicInfo() {
    return {
      roomId: this.roomId,
      hostUserId: this.hostUserId,
      status: this.status,
      playerCount: this.playerCount,
      maxPlayers: MAX_PLAYERS_PER_ROOM,
    };
  }
}

module.exports = Room;
