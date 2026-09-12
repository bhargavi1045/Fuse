import { useMemo, useState } from 'react';
import useGameSocket from './useGameSocket';
import useKeyboardInput from './useKeyboardInput';
import GameCanvas from './GameCanvas';
import PlayerHUD from '../components/PlayerHUD';
import GameOverModal from '../components/GameOverModal';
import Button from '../components/Button';
import { GAME_STATUS } from '../socket/socketEvents';

function GamePage({ roomId, selfId, onLeaveRoom }) {
  const { socket, gameState, eliminations, gameOver, error, leaveRoom } = useGameSocket(roomId);
  const [shareStatus, setShareStatus] = useState(null);

  const inProgress = gameState?.status === GAME_STATUS.IN_PROGRESS;
  useKeyboardInput(socket, inProgress);

  const winnerName = useMemo(() => {
    if (!gameOver || !gameState) return null;
    return gameState.players.find((p) => p.playerId === gameOver.winner)?.username;
  }, [gameOver, gameState]);

  function handleLeave() {
    leaveRoom();
    onLeaveRoom();
  }

  async function handleShare() {
    const shareData = {
      title: 'Join my BlastZone room',
      text: `Join my BlastZone room: ${roomId}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('Shared');
      } else {
        await navigator.clipboard.writeText(roomId);
        setShareStatus('Copied');
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') {
        setShareStatus('Unable to share');
      }
    }
  }

  if (error) {
    return (
      <div className="bz-panel bz-panel--center">
        <p className="bz-error">{error}</p>
        <Button onClick={handleLeave}>Back to rooms</Button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="bz-panel bz-panel--center">
        <p>Joining room…</p>
      </div>
    );
  }

  const latestElimination = eliminations[eliminations.length - 1];

  return (
    <div className="bz-game">
      <header className="bz-game__header">
        <div>
          <p className="bz-eyebrow">Room {roomId}</p>
          <h1 className="bz-game__title">
            {gameState.status === GAME_STATUS.WAITING && 'Waiting for another player…'}
            {gameState.status === GAME_STATUS.IN_PROGRESS && 'Match in progress'}
            {gameState.status === GAME_STATUS.FINISHED && 'Match finished'}
          </h1>
        </div>
        <div className="bz-game__actions">
          <Button variant="ghost" onClick={handleShare}>
            {shareStatus || 'Share room'}
          </Button>
          <Button variant="ghost" onClick={handleLeave}>
            Leave room
          </Button>
        </div>
      </header>

      <div className="bz-game__body">
        <GameCanvas gameState={gameState} selfId={selfId} />

        <aside className="bz-game__sidebar">
          <PlayerHUD players={gameState.players} selfId={selfId} />

          {gameState.status === GAME_STATUS.WAITING && (
            <p className="bz-hint">Share the room ID with a friend - the match starts once 2 players have joined.</p>
          )}

          {inProgress && (
            <p className="bz-hint">Move: arrow keys / WASD &nbsp;·&nbsp; Bomb: space</p>
          )}

          {latestElimination && (
            <p className="bz-toast">
              {gameState.players.find((p) => p.playerId === latestElimination.playerId)?.username || 'A player'} was
              eliminated
            </p>
          )}
        </aside>
      </div>

      {gameOver && (
        <GameOverModal winnerId={gameOver.winner} winnerName={winnerName} selfId={selfId} onLeave={handleLeave} />
      )}
    </div>
  );
}

export default GamePage;
