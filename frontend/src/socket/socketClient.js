import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

let socket = null;

function getSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
}

export { getSocket, connectSocket, disconnectSocket };
