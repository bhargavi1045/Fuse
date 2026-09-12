import { useCallback, useState } from 'react';
import { connectSocket } from '../socket/socketClient';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../socket/socketEvents';

const JOIN_TIMEOUT_MS = 6000;

function useJoinRoom() {
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const joinRoom = useCallback((roomId) => {
    setIsJoining(true);
    setJoinError(null);

    return new Promise((resolve, reject) => {
      const socket = connectSocket();

      function cleanup() {
        socket.off(SERVER_EVENTS.GAME_STATE, onState);
        socket.off(SERVER_EVENTS.ERROR, onError);
        socket.off('connect_error', onConnectError);
        clearTimeout(timeoutId);
        setIsJoining(false);
      }

      function onState(state) {
        cleanup();
        resolve(state);
      }

      function onError(payload) {
        cleanup();
        const message = payload?.message || 'Failed to join room';
        setJoinError(message);
        reject(new Error(message));
      }
      
      function onConnectError(err) {
        cleanup();
        const message = /token/i.test(err.message) ? 'Your session has expired - please log in again' : err.message;
        setJoinError(message);
        reject(new Error(message));
      }

      const timeoutId = setTimeout(() => {
        cleanup();
        const message = 'Timed out waiting for the server';
        setJoinError(message);
        reject(new Error(message));
      }, JOIN_TIMEOUT_MS);

      socket.once(SERVER_EVENTS.GAME_STATE, onState);
      socket.once(SERVER_EVENTS.ERROR, onError);
      socket.once('connect_error', onConnectError);

      if (socket.connected) {
        socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });
      } else {
        socket.once('connect', () => socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId }));
        socket.connect();
      }
    });
  }, []);

  return { joinRoom, isJoining, joinError };
}

export default useJoinRoom;
