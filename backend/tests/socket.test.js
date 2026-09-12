jest.mock('../src/config/constants', () => {
  const actual = jest.requireActual('../src/config/constants');
  return {
    ...actual,
    RECONNECT_GRACE_PERIOD_MS: 1000,
    TICK_RATE: 20,
    TICK_INTERVAL_MS: 50,
  };
});

const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { io: ioClient } = require('socket.io-client');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const createApp = require('../src/app');
const initSockets = require('../src/sockets');
const roomManager = require('../src/rooms/roomManager');
const authService = require('../src/auth/auth.service');

let mongod;
let httpServer;
let io;
let app;
let port;
let userToken;
let userToken2;

async function registerUser(username) {
  await request(app).post('/api/auth/register').send({
    username,
    email: `${username}@example.com`,
    password: 'password123',
  });
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username, password: 'password123' });
  return loginRes.headers['set-cookie'][0].split(';')[0];
}

function connectClient(cookieHeader) {
  return ioClient(`http://localhost:${port}`, {
    extraHeaders: { Cookie: cookieHeader },
    transports: ['websocket'],
    forceNew: true,
  });
}

function waitFor(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  app = createApp();
  httpServer = http.createServer(app);
  io = new Server(httpServer, { cors: { origin: '*' } });
  initSockets(io);

  await new Promise((resolve) => {
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      resolve();
    });
  });

  userToken = await registerUser('sockuser1');
  userToken2 = await registerUser('sockuser2');
});

afterAll(async () => {
  io.close();
  httpServer.close();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(() => {
  roomManager.reset();
});

test('rejects connection without a valid token', async () => {
  const badClient = ioClient(`http://localhost:${port}`, {
    auth: { token: 'not-a-real-token' },
    transports: ['websocket'],
    forceNew: true,
  });

  const err = await waitFor(badClient, 'connect_error');
  expect(err).toBeDefined();
  badClient.close();
});

test('authenticated client can connect, join a room, and receive state', async () => {
  const payload = authService.verifyToken(userToken.split('=')[1]);
  const room = roomManager.createRoom(payload.sub);

  const client = connectClient(userToken);
  await waitFor(client, 'connect');

  client.emit('JOIN_ROOM', { roomId: room.roomId });
  const state = await waitFor(client, 'GAME_STATE');

  expect(state.players.length).toBe(1);
  expect(state.players[0].username).toBe('sockuser1');

  client.close();
});

test('game starts and broadcasts movement once two players join', async () => {
  const payload1 = authService.verifyToken(userToken.split('=')[1]);
  const room = roomManager.createRoom(payload1.sub);

  const client1 = connectClient(userToken);
  const client2 = connectClient(userToken2);

  await Promise.all([waitFor(client1, 'connect'), waitFor(client2, 'connect')]);

  client1.emit('JOIN_ROOM', { roomId: room.roomId });
  await waitFor(client1, 'GAME_STATE');

  client2.emit('JOIN_ROOM', { roomId: room.roomId });
  await new Promise((resolve) => {
    client2.on('GAME_STATE', (state) => {
      if (state.status === 'in_progress' && state.players.length === 2) resolve(state);
    });
  });

  const player1 = room.state.players[payload1.sub];
  const startX = player1.x;

  const movedStatePromise = new Promise((resolve) => {
    client1.on('GAME_STATE', (state) => {
      const me = state.players.find((p) => p.playerId === payload1.sub);
      if (me && me.x !== startX) resolve(state);
    });
  });

  client1.emit('PLAYER_INPUT', { direction: 'right' });
  await movedStatePromise;

  client1.close();
  client2.close();
});

test('placing a bomb is broadcast in the authoritative state', async () => {
  const payload1 = authService.verifyToken(userToken.split('=')[1]);
  const room = roomManager.createRoom(payload1.sub);

  const client1 = connectClient(userToken);
  const client2 = connectClient(userToken2);
  await Promise.all([waitFor(client1, 'connect'), waitFor(client2, 'connect')]);

  client1.emit('JOIN_ROOM', { roomId: room.roomId });
  await waitFor(client1, 'GAME_STATE');
  client2.emit('JOIN_ROOM', { roomId: room.roomId });

  await new Promise((resolve) => {
    client1.on('GAME_STATE', (state) => {
      if (state.status === 'in_progress') resolve(state);
    });
  });

  const bombPlacedPromise = new Promise((resolve) => {
    client1.on('GAME_STATE', (state) => {
      if (state.bombs.length > 0) resolve(state);
    });
  });

  client1.emit('PLACE_BOMB');
  const state = await bombPlacedPromise;

  expect(state.bombs[0].ownerId).toBe(payload1.sub);

  client1.close();
  client2.close();
});

test('disconnect starts a grace period and reconnect restores the player', async () => {
  const payload1 = authService.verifyToken(userToken.split('=')[1]);
  const room = roomManager.createRoom(payload1.sub);

  const client1 = connectClient(userToken);
  await waitFor(client1, 'connect');
  client1.emit('JOIN_ROOM', { roomId: room.roomId });
  await waitFor(client1, 'GAME_STATE');

  client1.close();

  await new Promise((resolve) => setTimeout(resolve, 200));

  const player = room.state.players[payload1.sub];
  expect(player.connected).toBe(false);
  expect(room.hasPlayer(payload1.sub)).toBe(true); 

  const client1b = connectClient(userToken);
  await waitFor(client1b, 'connect');
  client1b.emit('JOIN_ROOM', { roomId: room.roomId });
  const state = await waitFor(client1b, 'GAME_STATE');

  const reconnectedPlayer = state.players.find((p) => p.playerId === payload1.sub);
  expect(reconnectedPlayer.connected).toBe(true);

  client1b.close();
});

test('player is removed after grace period expires without reconnecting', async () => {
  const payload1 = authService.verifyToken(userToken.split('=')[1]);
  const room = roomManager.createRoom(payload1.sub);

  const client1 = connectClient(userToken);
  await waitFor(client1, 'connect');
  client1.emit('JOIN_ROOM', { roomId: room.roomId });
  await waitFor(client1, 'GAME_STATE');

  client1.close();

  await new Promise((resolve) => setTimeout(resolve, 1400));

  expect(roomManager.getRoom(room.roomId)).toBeNull();
});
