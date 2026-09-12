import { useEffect, useRef } from 'react';
import { CLIENT_EVENTS, DIRECTIONS } from '../socket/socketEvents';

const MOVE_KEYS = {
  ArrowUp: DIRECTIONS.UP,
  ArrowDown: DIRECTIONS.DOWN,
  ArrowLeft: DIRECTIONS.LEFT,
  ArrowRight: DIRECTIONS.RIGHT,
  w: DIRECTIONS.UP,
  s: DIRECTIONS.DOWN,
  a: DIRECTIONS.LEFT,
  d: DIRECTIONS.RIGHT,
};

const BOMB_KEYS = new Set([' ', 'Spacebar']);
const MOVE_REPEAT_MS = 130;

function useKeyboardInput(socket, active) {
  const pressedRef = useRef(new Set());

  useEffect(() => {
    if (!active || !socket) return undefined;

    function handleKeyDown(e) {
      if (MOVE_KEYS[e.key]) {
        e.preventDefault();
        pressedRef.current.add(e.key);
      } else if (BOMB_KEYS.has(e.key)) {
        e.preventDefault();
        socket.emit(CLIENT_EVENTS.PLACE_BOMB);
      }
    }

    function handleKeyUp(e) {
      pressedRef.current.delete(e.key);
    }

    function handleBlur() {
      pressedRef.current.clear();
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    const intervalId = setInterval(() => {
      const keys = pressedRef.current;
      if (keys.size === 0) return;

      const lastKey = Array.from(keys).pop();
      const direction = MOVE_KEYS[lastKey];
      if (direction) {
        socket.emit(CLIENT_EVENTS.PLAYER_INPUT, { direction });
      }
    }, MOVE_REPEAT_MS);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      clearInterval(intervalId);
      pressedRef.current.clear();
    };
  }, [socket, active]);
}

export default useKeyboardInput;
