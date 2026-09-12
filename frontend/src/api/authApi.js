import { request } from './httpClient';

function register({ username, email, password }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: { username, email, password },
  });
}

function login({ username, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

function me() {
  return request('/api/auth/me', { auth: true });
}

function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export { register, login, me, logout };
