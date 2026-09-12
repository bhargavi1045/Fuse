const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createApp = require('../src/app');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

describe('POST /api/auth/register', () => {
  test('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.headers['set-cookie'][0]).toMatch(/^blastzone_token=/);
    expect(res.body.user.username).toBe('alice');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('rejects duplicate registration', async () => {
    await request(app).post('/api/auth/register').send({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      username: 'bob',
      email: 'bob@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(409);
  });

  test('rejects state-changing requests from an untrusted origin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'https://attacker.example')
      .send({ username: 'blocked', email: 'blocked@example.com', password: 'password123' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      username: 'carol',
      email: 'carol@example.com',
      password: 'correct-password',
    });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'carol',
      password: 'correct-password',
    });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/^blastzone_token=/);
  });

  test('rejects invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'carol',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
  });

  test('never exposes the password hash', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'carol',
      password: 'correct-password',
    });

    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('restores and clears a cookie session', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      username: 'carol',
      password: 'correct-password',
    });
    const agent = request.agent(app);

    await agent.post('/api/auth/login').send({
      username: 'carol',
      password: 'correct-password',
    });
    const meRes = await agent.get('/api/auth/me');
    const logoutRes = await agent.post('/api/auth/logout');

    expect(loginRes.headers['set-cookie'][0]).toMatch(/^blastzone_token=/);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.username).toBe('carol');
    expect(logoutRes.status).toBe(204);
    expect(logoutRes.headers['set-cookie'][0]).toMatch(/^blastzone_token=;/);
  });
});
