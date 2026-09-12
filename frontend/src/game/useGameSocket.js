import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket } from '../socket/socketClient';
import { CLIENT_EVENTS, SERVER_EVENTS } from '../socket/socketEvents';

function useGameSocket(roomId) {
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [eliminations, setEliminations] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!roomId) return undefined;

    const socket = connectSocket();
    socketRef.current = socket;

    function joinRoom() {
      socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });
    }

    function handleGameState(state) {
      setGameState(state);
      setJoined(true);
    }

    function handleEliminated(payload) {
      setEliminations((prev) => [...prev, payload]);
    }

    function handleGameOver(payload) {
      setGameOver(payload);
    }

    function handleError(payload) {
      setError(payload?.message || 'Something went wrong');
    }

    function handleConnectError(err) {
      setError(/token/i.test(err.message) ? 'Your session has expired - please log in again' : err.message);
    }

    socket.on(SERVER_EVENTS.GAME_STATE, handleGameState);
    socket.on(SERVER_EVENTS.PLAYER_ELIMINATED, handleEliminated);
    socket.on(SERVER_EVENTS.GAME_OVER, handleGameOver);
    socket.on(SERVER_EVENTS.ERROR, handleError);
    socket.on('connect_error', handleConnectError);
    socket.on('connect', joinRoom);

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off(SERVER_EVENTS.GAME_STATE, handleGameState);
      socket.off(SERVER_EVENTS.PLAYER_ELIMINATED, handleEliminated);
      socket.off(SERVER_EVENTS.GAME_OVER, handleGameOver);
      socket.off(SERVER_EVENTS.ERROR, handleError);
      socket.off('connect_error', handleConnectError);
      socket.off('connect', joinRoom);
    };
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      socket.emit(CLIENT_EVENTS.LEAVE_ROOM);
    }
    setGameState(null);
    setGameOver(null);
    setEliminations([]);
    setJoined(false);
  }, []);

  return {
    socket: socketRef.current,
    gameState,
    eliminations,
    gameOver,
    error,
    joined,
    leaveRoom,
  };
}

export default useGameSocket;
