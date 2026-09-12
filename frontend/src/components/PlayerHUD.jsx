import ConnectionBadge from './ConnectionBadge';

const HEART = '♥';

function PlayerHUD({ players, selfId }) {
  return (
    <ul className="bz-hud">
      {players.map((player) => (
        <li
          key={player.playerId}
          className={`bz-hud__row ${!player.alive ? 'bz-hud__row--eliminated' : ''} ${
            player.playerId === selfId ? 'bz-hud__row--self' : ''
          }`}
        >
          <span className="bz-hud__name">
            {player.username}
            {player.playerId === selfId ? ' (you)' : ''}
          </span>

          <span className="bz-hud__health" aria-label={`${player.health} health`}>
            {player.alive ? HEART.repeat(Math.max(player.health, 0)) || '—' : 'eliminated'}
          </span>

          <ConnectionBadge connected={player.connected} />
        </li>
      ))}
    </ul>
  );
}

export default PlayerHUD;
