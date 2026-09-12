import { request } from './httpClient';

function createRoom() {
  return request('/api/rooms', { method: 'POST', auth: true });
}

function listRooms() {
  return request('/api/rooms', { method: 'GET', auth: true });
}

function getRoom(roomId) {
  return request(`/api/rooms/${roomId}`, { method: 'GET', auth: true });
}

export { createRoom, listRooms, getRoom };
