// main.js — Night Gallery Heist: game state, the loop, alarm, loot, tools,
// win/lose and restart. Wires input, guards, cameras, tools, audio and
// the renderer together; the rules live in the modules it imports.

import { LEVEL, PATROLS, CAMERAS, VENT_DOOR, circleHitsWall, pointInRect } from './level.js';
import { createInput } from './input.js';
import { createGuard, updateGuard, guardSeesThief, lureNearestGuard, GRACE_SECONDS, SPOT_RATE } from './guards.js';
import { createCamera, cameraSeesThief, CAMERA_SPOT_RATE } from './cameras.js';
import { createTools, throwNoisemaker, throwSmoke, updateSmoke, updateLockpick } from './tools.js';
import { sfx, unlockAudio } from './audio.js';
import { drawFrame, HUD_HEIGHT } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const THIEF_SPEED = 175; // px per second
const THIEF_RADIUS = 13;
const ALARM_DECAY = 4;   // points per second while unseen

// Deterministic screenshot setups, driven by ?shot= in the URL. The game
// itself is identical; these only place the thief and the alarm so a
// screenshot shows the whole heist at a glance.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

function freshState() {
  // Deep-copy the mutable level bits so a restart is truly fresh.
  VENT_DOOR.open = false;
  const coins = LEVEL.coins.map((c) => ({ ...c }));
  return {
    mode: 'title',
    time: 0,
    elapsed: 0,
    alarm: 0,
    spotted: false,
    hasGem: false,
    score: 0,
    lootScore: 0,
    timeBonus: 0,
    alarmBonus: 0,
    thief: { x: LEVEL.start.x, y: LEVEL.start.y, r: THIEF_RADIUS, facing: 0, hasGem: false },
    guards: PATROLS.map((p, i) => createGuard(p, i)),
    cameras: CAMERAS.map(createCamera),
    tools: createTools(),
    coins,
    stepTimer: 0,
    spottedTimer: 0,
    won: false,
  };
}

let state = freshState();

function applyShotSetup() {
  if (!shot) return;
  state.mode = 'playing';
  if (shot === 'cover') {
    // Mid-room, mid-heist: thief on the carpet, a guard cone sweeping
    // nearby, the gem glowing, alarm part-filled — everything in one frame.
    state.thief.x = 470; state.thief.y = 400; state.thief.facing = -Math.PI / 2;
    state.alarm = 38;
    state.tools.coins = 2;
    state.guards[0].x = 420; state.guards[0].y = 330; state.guards[0].angle = Math.PI / 2;
    state.guards[1].x = 700; state.guards[1].y = 300; state.guards[1].angle = Math.PI;
  } else if (shot === 'alarm') {
    // Caught in a cone's edge: the "!" grace warning, alarm nearly full.
    // Mara walks west along y=330, so the thief stands ahead of her.
    state.thief.x = 480; state.thief.y = 330; state.thief.facing = 0;
    state.guards[0].x = 560; state.guards[0].y = 330;
    state.guards[0].waypointIndex = 3; // target (300,330): walking west
    state.guards[0].pauseLeft = 0;
    state.guards[0].angle = Math.PI;
    state.guards[0].seenTime = 0.3;
    state.alarm = 82;
    state.hasGem = true;
    state.thief.hasGem = true;
    state.tools.coins = 1;
  } else if (shot === 'win') {
    state.mode = 'won';
    state.hasGem = true;
    state.thief.hasGem = true;
    state.thief.x = 88; state.thief.y = 560;
    finishScore();
  }
}

function finishScore() {
  const loot = state.coins.filter((c) => c.taken).length * 100 + (state.hasGem ? 500 : 0);
  const timeBonus = Math.max(0, Math.round(600 - state.elapsed * 5));
  const alarmBonus = Math.round((100 - state.alarm) * 3);
  state.lootScore = loot;
  state.timeBonus = timeBonus;
  state.alarmBonus = alarmBonus;
  state.score = loot + timeBonus + alarmBonus;
}

function startGame() {
  const keepShot = shot;
  state = freshState();
  state.mode = 'playing';
  if (keepShot === 'cover' || keepShot === 'alarm') applyShotSetup();
  unlockAudio();
}

function endGame(won) {
  state.mode = won ? 'won' : 'lost';
  state.won = won;
  finishScore();
  if (won) sfx.win(); else sfx.caught();
}

function moveThief(dt, input) {
  const t = state.thief;
  const nx = t.x + input.moveX * THIEF_SPEED * dt;
  const ny = t.y + input.moveY * THIEF_SPEED * dt;
  // Axis-separated movement so the thief slides along walls.
  if (!circleHitsWall(nx, t.y, t.r)) t.x = nx;
  if (!circleHitsWall(t.x, ny, t.r)) t.y = ny;
  t.x = Math.max(24 + t.r, Math.min(LEVEL.width - 24 - t.r, t.x));
  t.y = Math.max(24 + t.r, Math.min(LEVEL.height - 24 - t.r, t.y));
  if (input.moveX || input.moveY) {
    t.facing = Math.atan2(input.moveY, input.moveX);
    state.stepTimer -= dt;
    if (state.stepTimer <= 0) { sfx.step(); state.stepTimer = 0.32; }
  }
}

function checkPickups() {
  const t = state.thief;
  for (const c of state.coins) {
    if (!c.taken && Math.hypot(t.x - c.x, t.y - c.y) < t.r + c.r + 4) {
      c.taken = true;
      state.tools.coins += 1;
      sfx.coin();
    }
  }
  const g = LEVEL.gem;
  if (!state.hasGem && Math.hypot(t.x - g.x, t.y - g.y) < t.r + g.r + 6) {
    state.hasGem = true;
    t.hasGem = true;
    sfx.gem();
  }
}

function updateAlarm(dt) {
  let seen = false;
  for (const guard of state.guards) {
    if (guardSeesThief(guard, state.thief, state.tools.smokePuffs)) {
      guard.seenTime += dt;
      if (guard.seenTime >= GRACE_SECONDS) {
        seen = true;
        state.alarm += SPOT_RATE * dt;
      }
    } else {
      guard.seenTime = 0;
    }
  }
  for (const cam of state.cameras) {
    if (cameraSeesThief(cam, state.time, state.thief, state.tools.smokePuffs)) {
      seen = true;
      state.alarm += CAMERA_SPOT_RATE * dt;
    }
  }
  if (!seen) state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  state.alarm = Math.min(100, state.alarm);
  const wasSpotted = state.spotted;
  state.spotted = seen;
  if (seen && !wasSpotted) sfx.spotted();
  if (seen) {
    state.spottedTimer -= dt;
    if (state.spottedTimer <= 0) { sfx.spotted(); state.spottedTimer = 0.7; }
  }
  if (state.alarm >= 100) endGame(false);
}

function updateTools(dt, input) {
  const t = state.thief;
  if (input.consume('Digit1')) {
    if (throwNoisemaker(state.tools)) {
      lureNearestGuard(state.guards, t.x, t.y, 3);
      sfx.clatter();
    }
  }
  if (input.consume('Digit2')) {
    if (throwSmoke(state.tools, t.x, t.y)) sfx.puff();
  }
  // Lockpick: hold 3 while standing at the vent door.
  const nearVent = Math.hypot(t.x - (VENT_DOOR.x + VENT_DOOR.w / 2), t.y - (VENT_DOOR.y + VENT_DOOR.h / 2)) < 60;
  const holding = input.isHeld('Digit3');
  if (nearVent && holding && !VENT_DOOR.open) {
    if (Math.random() < dt * 8) sfx.pick();
  }
  if (updateLockpick(state.tools, dt, nearVent, holding, VENT_DOOR)) sfx.ventOpen();
  updateSmoke(state.tools, dt);
}

function updatePlaying(dt, input) {
  state.elapsed += dt;
  input.update();
  moveThief(dt, input);
  for (const guard of state.guards) updateGuard(guard, dt, state.time);
  updateTools(dt, input);
  checkPickups();
  updateAlarm(dt);
  if (state.mode !== 'playing') return;
  // Win: the gem in hand and the thief back at the exit door.
  if (state.hasGem && pointInRect(state.thief.x, state.thief.y, LEVEL.exit)) {
    endGame(true);
  }
}

const input = createInput(canvas);
applyShotSetup();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.time += dt;

  if (state.mode === 'title') {
    if (input.consume('Enter') || input.consume('Space') || input.consumeClick()) {
      startGame();
    }
    // Let the title screen show the guards patrolling behind the overlay.
    for (const guard of state.guards) updateGuard(guard, dt, state.time);
  } else if (state.mode === 'playing') {
    updatePlaying(dt, input);
  } else if (input.consume('KeyR') || input.consumeClick()) {
    startGame();
  }

  drawFrame(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose a tiny handle for automated playtests (not used by the game).
window.__heist = {
  get state() { return state; },
  start: startGame,
};
