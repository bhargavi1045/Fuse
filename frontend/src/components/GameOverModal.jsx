import Button from './Button';

function GameOverModal({ winnerName, selfId, winnerId, onLeave }) {
  const won = winnerId && winnerId === selfId;
  const draw = !winnerId;

  return (
    <div className="bz-modal-overlay">
      <div className="bz-modal">
        <p className="bz-modal__eyebrow">Match over</p>
        <h2 className="bz-modal__title">
          {draw ? 'No survivors' : won ? 'You survived the blast' : `${winnerName} wins`}
        </h2>
        <p className="bz-modal__body">
          {draw
            ? 'Everyone went down in the same round.'
            : won
              ? 'Every other player was eliminated.'
              : 'Better luck defusing the next one.'}
        </p>
        <Button onClick={onLeave}>Back to rooms</Button>
      </div>
    </div>
  );
}

export default GameOverModal;
