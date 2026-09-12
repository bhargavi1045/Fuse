const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } = require('../config/constants');

class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

async function register({ username, email, password }) {
  if (!username || !email || !password) {
    throw new AuthError('username, email and password are required', 400);
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    throw new AuthError('Username or email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const user = await User.create({ username, email, passwordHash });

  const token = signToken(user);
  return { user: user.toSafeJSON(), token };
}

async function login({ username, password }) {
  if (!username || !password) {
    throw new AuthError('username and password are required', 400);
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new AuthError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AuthError('Invalid credentials', 401);
  }

  const token = signToken(user);
  return { user: user.toSafeJSON(), token };
}

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { register, login, signToken, verifyToken, AuthError };
