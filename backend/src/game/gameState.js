const { createMap, getSpawnPoints } = require('./map');
const { createPlayer, applyDamage } = require('./player');
const { GAME_STATUS } = require('../config/constants');

function createGameState() {
  return {
    map: createMap(),
    players: {}, 
    bombs: {}, 
    explosions: [], 
    status: GAME_STATUS.WAITING,
    winner: null, 
    tick: 0,
  };
}

function addPlayer(state, { playerId, userId, username, socketId }) {
  const spawnPoints = getSpawnPoints();
  const takenSpawns = new Set(
    Object.values(state.players).map((p) => `${p.x},${p.y}`)
  );
  const spawn =
    spawnPoints.find((p) => !takenSpawns.has(`${p.x},${p.y}`)) || spawnPoints[0];

  const player = createPlayer({
    playerId,
    userId,
    username,
    x: spawn.x,
    y: spawn.y,
    socketId,
  });

  state.players[playerId] = player;
  return player;
}

function getPlayer(state, playerId) {
  return state.players[playerId] || null;
}

function markPlayerDisconnected(state, playerId) {
  const player = getPlayer(state, playerId);
  if (player) {
    player.connected = false;
    player.socketId = null;
  }
  return player;
}

function reconnectPlayer(state, playerId, socketId) {
  const player = getPlayer(state, playerId);
  if (player) {
    player.connected = true;
    player.socketId = socketId;
  }
  return player;
}

function removePlayer(state, playerId) {
  delete state.players[playerId];
}

function addBomb(state, bomb) {
  state.bombs[bomb.bombId] = bomb;
}

function removeBomb(state, bombId) {
  delete state.bombs[bombId];
}

function applyExplosionDamage(state, cells, damageAmount, immunePlayerId = null) {
  const eliminated = [];
  const cellSet = new Set(cells.map((c) => `${c.x},${c.y}`));

  Object.values(state.players).forEach((player) => {
    if (player.playerId === immunePlayerId) return;
    if (!player.alive) return;
    if (!cellSet.has(`${player.x},${player.y}`)) return;

    applyDamage(player, damageAmount);
    if (!player.alive) {
      eliminated.push(player.playerId);
    }
  });

  return eliminated;
}

function computeGameOverResult(state) {
  if (state.status !== GAME_STATUS.IN_PROGRESS) {
    return { isOver: false };
  }

  const alivePlayers = Object.values(state.players).filter((p) => p.alive);

  if (alivePlayers.length <= 1) {
    return {
      isOver: true,
      winner: alivePlayers.length === 1 ? alivePlayers[0].playerId : null,
    };
  }

  return { isOver: false };
}

function serialize(state) {
  return {
    tick: state.tick,
    status: state.status,
    winner: state.winner,
    map: state.map,
    players: Object.values(state.players).map((p) => ({
      playerId: p.playerId,
      username: p.username,
      x: p.x,
      y: p.y,
      health: p.health,
      alive: p.alive,
      connected: p.connected,
    })),
    bombs: Object.values(state.bombs).map((b) => ({
      bombId: b.bombId,
      ownerId: b.ownerId,
      x: b.x,
      y: b.y,
      explodeAt: b.explodeAt,
      exploded: b.exploded,
    })),
    explosions: state.explosions.map((e) => ({ x: e.x, y: e.y })),
  };
}

module.exports = {
  createGameState,
  addPlayer,
  getPlayer,
  markPlayerDisconnected,
  reconnectPlayer,
  removePlayer,
  addBomb,
  removeBomb,
  applyExplosionDamage,
  computeGameOverResult,
  serialize,
};
