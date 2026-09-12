const cookie = require('cookie');

const AUTH_COOKIE_NAME = 'blastzone_token';

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function getTokenFromCookieHeader(header = '') {
  return cookie.parse(header)[AUTH_COOKIE_NAME] || null;
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}

module.exports = { getTokenFromCookieHeader, setAuthCookie, clearAuthCookie };