import { CELL_SIZE, COLORS, PLAYER_COLORS } from './gameConstants';

function cellRect(x, y) {
  return { px: x * CELL_SIZE, py: y * CELL_SIZE, size: CELL_SIZE };
}

function drawMap(ctx, map) {
  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const { px, py, size } = cellRect(x, y);
      const cell = map.grid[y][x];

      ctx.fillStyle = cell === 'wall' ? COLORS.wall : (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(px, py, size, size);

      if (cell === 'wall') {
        ctx.strokeStyle = COLORS.wallEdge;
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, size - 2, size - 2);
      } else {
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
      }
    }
  }
}

function drawBombs(ctx, bombs, now) {
  bombs.forEach((bomb) => {
    if (bomb.exploded) return;

    const { px, py, size } = cellRect(bomb.x, bomb.y);
    const cx = px + size / 2;
    const cy = py + size / 2;
    const radius = size * 0.32;

    const msLeft = Math.max(0, bomb.explodeAt - now);
    const blinkSpeed = msLeft < 600 ? 90 : msLeft < 1400 ? 220 : 450;
    const pulse = Math.sin(now / blinkSpeed) * 0.5 + 0.5;

    ctx.fillStyle = COLORS.bomb;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.bombFuse;
    ctx.lineWidth = 2 + pulse * 2;
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function drawExplosions(ctx, explosions) {
  explosions.forEach((cell) => {
    const { px, py, size } = cellRect(cell.x, cell.y);
    const cx = px + size / 2;
    const cy = py + size / 2;

    const gradient = ctx.createRadialGradient(cx, cy, size * 0.05, cx, cy, size * 0.55);
    gradient.addColorStop(0, COLORS.explosionCore);
    gradient.addColorStop(1, COLORS.explosion);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayers(ctx, players, selfId) {
  players.forEach((player, index) => {
    const { px, py, size } = cellRect(player.x, player.y);
    const cx = px + size / 2;
    const cy = py + size / 2;
    const radius = size * 0.34;

    ctx.globalAlpha = player.alive ? (player.connected ? 1 : 0.45) : 0.25;

    ctx.fillStyle = !player.alive ? COLORS.dead : PLAYER_COLORS[index % PLAYER_COLORS.length];
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    if (player.playerId === selfId) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#E9EAEC';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(player.username, cx, py - 4 < 10 ? py + size + 12 : py - 6);
  });
}

export { drawMap, drawBombs, drawExplosions, drawPlayers, cellRect };
