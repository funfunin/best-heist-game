// guards.js — patrol movement, vision cones and spotting the thief.
// A guard walks its waypoints, pauses and sweeps its cone; a thief caught
// inside a cone with line of sight raises the alarm. A noisemaker lure
// pulls the nearest guard off its route for a few seconds.

import { hasLineOfSight, circleHitsWall } from './level.js';

export const CONE_RANGE = 175;
export const CONE_HALF_ANGLE = 0.56; // ~64 degrees total
export const SPOT_RATE = 55;          // alarm points per second, fully seen
export const GRACE_SECONDS = 0.55;    // fair warning before the alarm climbs

export function createGuard(patrol, index) {
  const start = patrol.waypoints[0];
  return {
    name: patrol.name,
    x: start.x,
    y: start.y,
    speed: patrol.speed,
    waypoints: patrol.waypoints,
    waypointIndex: 1,
    pause: patrol.pause,
    pauseLeft: 0,
    // Base facing while paused; the cone sweeps around it, never drifts.
    pauseBase: 0,
    pauseElapsed: 0,
    // Facing angle; while paused the guard sweeps it back and forth.
    angle: Math.atan2(
      patrol.waypoints[1].y - start.y,
      patrol.waypoints[1].x - start.x,
    ),
    sweepPhase: index * 1.7,
    // Lure state: {x, y, timeLeft} while a noisemaker holds the guard.
    lure: null,
    // 0..1: how long the thief has been continuously visible (grace).
    seenTime: 0,
    alerted: false,
  };
}

// Move one guard along its route. Returns nothing; mutates the guard.
export function updateGuard(guard, dt, time) {
  if (guard.lure) {
    guard.lure.timeLeft -= dt;
    moveToward(guard, guard.lure.x, guard.lure.y, dt);
    guard.angle = Math.atan2(guard.lure.y - guard.y, guard.lure.x - guard.x);
    if (guard.lure.timeLeft <= 0) guard.lure = null;
    return;
  }
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.pauseElapsed += dt;
    // Sweep the cone around the facing the guard arrived with.
    guard.angle = guard.pauseBase + Math.sin(guard.pauseElapsed * 1.6 + guard.sweepPhase) * 0.55;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const arrived = moveToward(guard, target.x, target.y, dt);
  guard.angle = Math.atan2(target.y - guard.y, target.x - guard.x);
  if (arrived) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pause;
    guard.pauseBase = guard.angle;
    guard.pauseElapsed = 0;
  }
}

function moveToward(guard, tx, ty, dt) {
  const dx = tx - guard.x, dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  const step = guard.speed * dt;
  if (dist <= step) {
    guard.x = tx; guard.y = ty;
    return true;
  }
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  if (!circleHitsWall(nx, ny, 14)) { guard.x = nx; guard.y = ny; }
  return false;
}

// Is the thief inside this guard's vision cone with a clear line of sight?
// Smoke puffs block the cone entirely while they last.
export function guardSeesThief(guard, thief, smokePuffs) {
  const dx = thief.x - guard.x, dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  let a = Math.atan2(dy, dx) - guard.angle;
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  if (Math.abs(a) > CONE_HALF_ANGLE) return false;
  for (const puff of smokePuffs) {
    if (Math.hypot(thief.x - puff.x, thief.y - puff.y) < puff.r) return false;
  }
  return hasLineOfSight(guard.x, guard.y, thief.x, thief.y);
}

// Lure the nearest guard to (x, y) for `seconds`.
export function lureNearestGuard(guards, x, y, seconds) {
  let best = null, bestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist) { best = g; bestDist = d; }
  }
  if (best) best.lure = { x, y, timeLeft: seconds };
  return best;
}
