// cameras.js — wall-mounted security cameras that sweep a fixed arc.
// Being caught in a beam raises the alarm more slowly than a guard's cone,
// but cameras never blink and never get lured.

import { hasLineOfSight } from './level.js';

export const CAMERA_SPOT_RATE = 34; // alarm points per second, in the beam

export function createCamera(spec) {
  return {
    x: spec.x,
    y: spec.y,
    baseAngle: spec.baseAngle,
    sweep: spec.sweep,
    speed: spec.speed,
    range: spec.range,
    halfAngle: spec.halfAngle,
    phase: Math.random() * Math.PI * 2,
  };
}

// The camera's current facing angle at time `t` (seconds).
export function cameraAngle(cam, t) {
  return cam.baseAngle + Math.sin(t * cam.speed + cam.phase) * cam.sweep;
}

// Is the thief inside this camera's sweeping beam with a clear line of
// sight? Smoke puffs block the beam too.
export function cameraSeesThief(cam, t, thief, smokePuffs) {
  const dx = thief.x - cam.x, dy = thief.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > cam.range) return false;
  let a = Math.atan2(dy, dx) - cameraAngle(cam, t);
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  if (Math.abs(a) > cam.halfAngle) return false;
  for (const puff of smokePuffs) {
    if (Math.hypot(thief.x - puff.x, thief.y - puff.y) < puff.r) return false;
  }
  return hasLineOfSight(cam.x, cam.y, thief.x, thief.y);
}
