import { useEffect, useRef } from 'react';
import { CELL_SIZE } from './gameConstants';
import { drawMap, drawBombs, drawExplosions, drawPlayers } from './renderer';

function GameCanvas({ gameState, selfId }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frameId;

    function render() {
      const state = stateRef.current;
      if (state) {
        const { width, height } = state.map;
        if (canvas.width !== width * CELL_SIZE) canvas.width = width * CELL_SIZE;
        if (canvas.height !== height * CELL_SIZE) canvas.height = height * CELL_SIZE;

        const now = Date.now();
        drawMap(ctx, state.map);
        drawExplosions(ctx, state.explosions);
        drawBombs(ctx, state.bombs, now);
        drawPlayers(ctx, state.players, selfId);
      }
      frameId = requestAnimationFrame(render);
    }

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [selfId]);

  return <canvas ref={canvasRef} className="bz-canvas" />;
}

export default GameCanvas;
