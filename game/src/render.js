// render.js — everything the player sees: the museum floor, vision cones,
// camera beams, the thief, the guards, the loot and the HUD. One clear job:
// drawing. No game logic lives here.

import { LEVEL, WALLS, VENT_DOOR } from './level.js';
import { CONE_RANGE, CONE_HALF_ANGLE } from './guards.js';
import { cameraAngle } from './cameras.js';

export const HUD_HEIGHT = 60;
const W = LEVEL.width, H = LEVEL.height;

function conePath(ctx, x, y, angle, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawFloor(ctx, time) {
  // Night museum: deep blue-grey tiles with a faint checker.
  ctx.fillStyle = '#171a2e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1b1f38';
  const tile = 40;
  for (let y = 0; y < H / tile; y++) {
    for (let x = 0; x < W / tile; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  // Velvet carpet runner down the main hall — the risky fast route.
  ctx.fillStyle = '#5a1f2b';
  ctx.fillRect(430, 24, 100, 592);
  ctx.fillStyle = '#7a2a38';
  ctx.fillRect(438, 24, 84, 592);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(438, 24, 84, 592);
  // Gold wall trim lines.
  ctx.strokeStyle = '#3a3f5e';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
}

function drawExit(ctx, time) {
  const e = LEVEL.exit;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  ctx.fillStyle = hasGemGlobal ? `rgba(46, 160, 90, ${0.55 + 0.3 * pulse})` : '#1d4d33';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = '#2ea05a';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#d7ffe6';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
}

let hasGemGlobal = false;

function drawLoot(ctx, state, time) {
  // Coins in their cases.
  for (const c of state.coins) {
    if (c.taken) continue;
    const bob = Math.sin(time * 2 + c.x) * 2;
    ctx.fillStyle = '#c9a227';
    ctx.beginPath(); ctx.arc(c.x, c.y + bob, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath(); ctx.arc(c.x, c.y + bob, c.r - 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6d1f';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('¢', c.x, c.y + bob + 4);
  }
  // The Velvet Star, pulsing gold in its glass case.
  if (!state.hasGem) {
    const g = LEVEL.gem;
    const pulse = 0.6 + 0.4 * Math.sin(time * 4);
    const glow = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, 46);
    glow.addColorStop(0, `rgba(255, 215, 90, ${0.55 * pulse})`);
    glow.addColorStop(1, 'rgba(255, 215, 90, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(g.x, g.y, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd75a';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - 18); ctx.lineTo(g.x + 13, g.y - 4); ctx.lineTo(g.x + 8, g.y + 14);
    ctx.lineTo(g.x - 8, g.y + 14); ctx.lineTo(g.x - 13, g.y - 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y - 18); ctx.lineTo(g.x + 13, g.y - 4); ctx.lineTo(g.x, g.y - 2);
    ctx.lineTo(g.x - 13, g.y - 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe98a';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ VELVET STAR ★', g.x - 10, g.y - 30);
  }
}

function drawWalls(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = '#2c3152';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    // Glass glint on the display cases.
    if (w.h <= 46 && w.w >= 100) {
      ctx.fillStyle = 'rgba(140, 220, 255, 0.14)';
      ctx.fillRect(w.x + 6, w.y + 6, w.w - 12, 10);
    }
  }
  // The vent door: locked (brass, barred) or open (dark hole).
  const d = VENT_DOOR;
  if (d.open) {
    ctx.fillStyle = '#05060f';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = '#2ea05a';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#2ea05a';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VENT OPEN', d.x + d.w / 2, d.y - 6);
  } else {
    ctx.fillStyle = '#6b5a2e';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#ffd75a';
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔒 VENT', d.x + d.w / 2, d.y - 6);
  }
}

function drawSmoke(ctx, tools) {
  for (const p of tools.smokePuffs) {
    const alpha = Math.min(0.55, p.timeLeft * 0.2);
    const grad = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, p.r);
    grad.addColorStop(0, `rgba(200, 200, 215, ${alpha})`);
    grad.addColorStop(1, 'rgba(200, 200, 215, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCones(ctx, state, time) {
  // Guard vision cones: amber normally, red while the thief is seen.
  for (const g of state.guards) {
    const seen = g.seenTime > 0;
    ctx.fillStyle = seen ? 'rgba(255, 60, 60, 0.34)' : 'rgba(255, 176, 32, 0.20)';
    conePath(ctx, g.x, g.y, g.angle, CONE_RANGE, CONE_HALF_ANGLE);
    ctx.fill();
    ctx.strokeStyle = seen ? 'rgba(255, 90, 90, 0.7)' : 'rgba(255, 200, 80, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // Camera beams: pale yellow wedges.
  for (const cam of state.cameras) {
    const a = cameraAngle(cam, time);
    ctx.fillStyle = 'rgba(255, 240, 150, 0.16)';
    conePath(ctx, cam.x, cam.y, a, cam.range, cam.halfAngle);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 240, 150, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCameras(ctx, state, time) {
  for (const cam of state.cameras) {
    ctx.fillStyle = '#3a3f5e';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2); ctx.stroke();
    const a = cameraAngle(cam, time);
    ctx.fillStyle = '#ffe98a';
    ctx.beginPath(); ctx.arc(cam.x + Math.cos(a) * 11, cam.y + Math.sin(a) * 11, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8d8e8';
    ctx.font = 'bold 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAM', cam.x, cam.y - 14);
  }
}

function drawGuards(ctx, state, time) {
  for (const g of state.guards) {
    // Body: navy uniform, white cap.
    ctx.fillStyle = '#232a4d';
    ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = g.seenTime > 0 ? '#ff5050' : '#8f97c8';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e8eaf6';
    ctx.beginPath(); ctx.arc(g.x, g.y - 3, 7, Math.PI, 0); ctx.fill();
    ctx.fillRect(g.x - 7, g.y - 4, 14, 3);
    // Facing tick.
    ctx.strokeStyle = '#e8eaf6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
    ctx.stroke();
    // "!" while the thief is inside the grace window — the fair warning.
    if (g.seenTime > 0 && g.seenTime < 0.55) {
      ctx.fillStyle = '#ff5050';
      ctx.font = 'bold 26px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 26);
    }
    ctx.fillStyle = '#c8cede';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + 26);
  }
}

function drawThief(ctx, thief, time) {
  const t = thief;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 10, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Cloak: near-black with a crimson scarf — readable at a glance.
  ctx.fillStyle = '#151320';
  ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ff3b4d';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ff3b4d';
  ctx.beginPath(); ctx.arc(t.x, t.y - 4, 5.5, Math.PI, 0); ctx.fill();
  // Facing tick.
  ctx.strokeStyle = '#ffe98a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.facing) * 17, t.y + Math.sin(t.facing) * 17);
  ctx.stroke();
  // The stolen gem glints on the thief once taken.
  if (t.hasGem) {
    ctx.fillStyle = '#ffd75a';
    ctx.beginPath(); ctx.arc(t.x + 9, t.y - 9, 4, 0, Math.PI * 2); ctx.fill();
  }
}

// --- HUD (top bar, 60 px) -----------------------------------------------

function drawHud(ctx, state) {
  ctx.fillStyle = '#0d1024';
  ctx.fillRect(0, 0, W, HUD_HEIGHT);
  ctx.strokeStyle = '#8a6d3b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, HUD_HEIGHT - 1); ctx.lineTo(W, HUD_HEIGHT - 1); ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8d9a0';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText('NIGHT GALLERY HEIST', 14, 26);
  ctx.fillStyle = '#8f97b8';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('steal the Velvet Star — slip out the EXIT', 14, 45);

  // Alarm meter: the big readable bar in the middle.
  const ax = 330, ay = 16, aw = 300, ah = 22;
  ctx.fillStyle = '#1a1d33';
  ctx.fillRect(ax, ay, aw, ah);
  const frac = Math.max(0, Math.min(1, state.alarm / 100));
  const col = frac < 0.4 ? '#2ea05a' : frac < 0.75 ? '#e8a13a' : '#ff3b4d';
  ctx.fillStyle = col;
  ctx.fillRect(ax, ay, aw * frac, ah);
  ctx.strokeStyle = '#e8d9a0';
  ctx.lineWidth = 2;
  ctx.strokeRect(ax, ay, aw, ah);
  ctx.fillStyle = '#f2ead0';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(state.alarm)}%`, ax + aw / 2, ay + 16);
  if (state.spotted) {
    ctx.fillStyle = '#ff5050';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('SPOTTED!', ax + aw / 2, ay + 38);
  }

  // Loot: gem status + coins + tools, right side.
  ctx.textAlign = 'left';
  ctx.fillStyle = state.hasGem ? '#ffd75a' : '#6b6f8a';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(state.hasGem ? '★ STAR TAKEN' : '☆ STAR', 660, 25);
  ctx.fillStyle = '#ffe98a';
  ctx.fillText(`¢ ${state.tools.coins}`, 660, 46);
  ctx.fillStyle = '#c8cede';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('1 lure · 2 smoke · 3 pick', 800, 25);
  ctx.fillText(`time ${formatTime(state.elapsed)}`, 800, 46);

  // Lockpick progress bar above the HUD's bottom edge.
  if (state.tools.lockpickProgress > 0) {
    const px = 330, pw = 300;
    ctx.fillStyle = '#1a1d33';
    ctx.fillRect(px, 46, pw, 8);
    ctx.fillStyle = '#7ab8ff';
    ctx.fillRect(px, 46, pw * state.tools.lockpickProgress, 8);
    ctx.fillStyle = '#dbe9ff';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PICKING LOCK…', px + pw / 2, 44);
  }
}

function formatTime(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// --- Screens ------------------------------------------------------------

function dimScreen(ctx, alpha) {
  ctx.fillStyle = `rgba(5, 6, 18, ${alpha})`;
  ctx.fillRect(0, 0, W, H + HUD_HEIGHT);
}

export function drawTitle(ctx, state) {
  drawWorld(ctx, state, state.time);
  dimScreen(ctx, 0.72);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8d9a0';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('NIGHT GALLERY', W / 2, 250);
  ctx.fillText('HEIST', W / 2, 312);
  ctx.fillStyle = '#ffd75a';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('One room. Three guards. One Velvet Star.', W / 2, 356);
  ctx.fillStyle = '#d8d8e8';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('WASD / arrows — move      1 — noisemaker (1¢, lures a guard)', W / 2, 408);
  ctx.fillText('2 — smoke puff (1¢, blocks cones)      3 — lockpick the vent door', W / 2, 434);
  ctx.fillText('Grab the ★, then slip out the EXIT before the alarm hits 100%.', W / 2, 460);
  ctx.fillStyle = '#8f97b8';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('Coins in the cases pay for your tools. Cameras never blink.', W / 2, 492);
  ctx.fillStyle = '#ffd75a';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('— press ENTER or click to begin —', W / 2, 548);
}

export function drawEnd(ctx, state, won) {
  drawWorld(ctx, state, state.time);
  dimScreen(ctx, 0.72);
  ctx.textAlign = 'center';
  if (won) {
    ctx.fillStyle = '#ffd75a';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY!', W / 2, 280);
    ctx.fillStyle = '#d8ffe6';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('The Velvet Star is yours. The gallery never saw a thing.', W / 2, 330);
  } else {
    ctx.fillStyle = '#ff5050';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillText('CAUGHT!', W / 2, 280);
    ctx.fillStyle = '#ffd8d8';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('The alarm hit 100% — the guards closed in.', W / 2, 330);
  }
  ctx.fillStyle = '#e8d9a0';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText(`SCORE  ${state.score}`, W / 2, 392);
  ctx.fillStyle = '#d8d8e8';
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`loot ${state.lootScore}  ·  time bonus ${state.timeBonus}  ·  alarm left ${state.alarmBonus}`, W / 2, 426);
  ctx.fillStyle = '#ffd75a';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText('— press R or click to play again —', W / 2, 486);
}

// --- World --------------------------------------------------------------

export function drawWorld(ctx, state, time) {
  hasGemGlobal = state.hasGem;
  drawFloor(ctx, time);
  drawExit(ctx, time);
  drawLoot(ctx, state, time);
  drawWalls(ctx);
  drawSmoke(ctx, state.tools);
  drawCones(ctx, state, time);
  drawCameras(ctx, state, time);
  drawGuards(ctx, state, time);
  drawThief(ctx, state.thief, time);
}

// Full frame: HUD bar on top, world below it.
export function drawFrame(ctx, state) {
  ctx.clearRect(0, 0, W, H + HUD_HEIGHT);
  if (state.mode === 'title') {
    drawHud(ctx, state);
    ctx.save();
    ctx.translate(0, HUD_HEIGHT);
    drawTitle(ctx, state);
    ctx.restore();
    return;
  }
  drawHud(ctx, state);
  ctx.save();
  ctx.translate(0, HUD_HEIGHT);
  if (state.mode === 'won') drawEnd(ctx, state, true);
  else if (state.mode === 'lost') drawEnd(ctx, state, false);
  else drawWorld(ctx, state, state.time);
  ctx.restore();
}
