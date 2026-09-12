const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../src/app');
const roomManager = require('../src/rooms/roomManager');
const { MAX_PLAYERS_PER_ROOM } = require('../src/config/constants');

let mongod;
let app;
let token;
let guestToken;

async function registerAndLogin(username) {
  await request(app).post('/api/auth/register').send({
    username,
    email: `${username}@example.com`,
    password: 'password123',
  });
  const res = await request(app).post('/api/auth/login').send({ username, password: 'password123' });
  return res.headers['set-cookie'][0].split(';')[0];
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
  token = await registerAndLogin('roomhost');
  guestToken = await registerAndLogin('roomguest');
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(() => {
  roomManager.reset();
});

describe('Room REST API', () => {
  test('rejects room creation without auth', async () => {
    const res = await request(app).post('/api/rooms');
    expect(res.status).toBe(401);
  });

  test('creates a room when authenticated', async () => {
    const res = await request(app).post('/api/rooms').set('Cookie', token);
    expect(res.status).toBe(201);
    expect(res.body.roomId).toBeDefined();
    expect(res.body.playerCount).toBe(0);
    expect(res.body.maxPlayers).toBe(MAX_PLAYERS_PER_ROOM);
  });

  test('lists active rooms', async () => {
    await request(app).post('/api/rooms').set('Cookie', token);
    const res = await request(app).get('/api/rooms').set('Cookie', token);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('does not list another user\'s invite-only room', async () => {
    await request(app).post('/api/rooms').set('Cookie', token);
    const res = await request(app).get('/api/rooms').set('Cookie', guestToken);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('gets a single room by id', async () => {
    const createRes = await request(app).post('/api/rooms').set('Cookie', token);
    const { roomId } = createRes.body;

    const res = await request(app).get(`/api/rooms/${roomId}`).set('Cookie', token);
    expect(res.status).toBe(200);
    expect(res.body.roomId).toBe(roomId);
  });

  test('returns 404 for an unknown room id', async () => {
    const res = await request(app).get('/api/rooms/does-not-exist').set('Cookie', token);
    expect(res.status).toBe(404);
  });
});

describe('Room join/leave and player limits (in-memory model)', () => {
  test('players can join up to the max, then further joins are rejected', () => {
    const room = roomManager.createRoom('host-1');

    for (let i = 0; i < MAX_PLAYERS_PER_ROOM; i += 1) {
      room.addPlayer({ playerId: `p${i}`, userId: `u${i}`, username: `user${i}`, socketId: `s${i}` });
    }

    expect(room.isFull()).toBe(true);
    expect(() =>
      room.addPlayer({ playerId: 'overflow', userId: 'u-overflow', username: 'overflow', socketId: 's-overflow' })
    ).toThrow();
  });

  test('leaving a room removes the player and empty rooms are cleaned up', () => {
    const room = roomManager.createRoom('host-2');
    room.addPlayer({ playerId: 'p1', userId: 'u1', username: 'Alice', socketId: 's1' });

    room.removePlayer('p1');
    expect(room.hasPlayer('p1')).toBe(false);

    roomManager.cleanupIfEmpty(room.roomId);
    expect(roomManager.getRoom(room.roomId)).toBeNull();
  });
});
