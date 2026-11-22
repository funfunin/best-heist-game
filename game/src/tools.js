// tools.js — the thief's kit. Every tool costs something, so each use is
// a decision: spend a coin, or risk the cone.
//
// 1 — Noisemaker: costs 1 coin, lures the nearest guard to the thief's
//     position for 3 seconds (walk away while it investigates).
// 2 — Smoke puff: costs 1 coin, blocks cones and camera beams in a 95 px
//     bubble around the thief for 4 seconds.
// 3 — Lockpick: free, but slow. Hold near the locked vent door for 2.5 s
//     to open the shortcut route to the gem.

export const TOOL_DEFS = {
  noisemaker: { key: 'Digit1', label: '1 Noisemaker', cost: 1, hint: 'lures a guard' },
  smoke: { key: 'Digit2', label: '2 Smoke puff', cost: 1, hint: 'blocks cones 4s' },
  lockpick: { key: 'Digit3', label: '3 Lockpick', cost: 0, hint: 'hold at vent door' },
};

export function createTools() {
  return {
    coins: 0,            // coins collected; the currency tools spend
    smokePuffs: [],      // {x, y, r, timeLeft}
    lockpickProgress: 0, // 0..1 while holding the pick at the vent door
  };
}

// Try to spend `cost` coins. Returns true when the purchase went through.
export function spendCoins(tools, cost) {
  if (tools.coins < cost) return false;
  tools.coins -= cost;
  return true;
}

export function throwNoisemaker(tools) {
  if (!spendCoins(tools, TOOL_DEFS.noisemaker.cost)) return false;
  return true;
}

export function throwSmoke(tools, x, y) {
  if (!spendCoins(tools, TOOL_DEFS.smoke.cost)) return false;
  tools.smokePuffs.push({ x, y, r: 95, timeLeft: 4 });
  return true;
}

export function updateSmoke(tools, dt) {
  for (const puff of tools.smokePuffs) puff.timeLeft -= dt;
  tools.smokePuffs = tools.smokePuffs.filter((p) => p.timeLeft > 0);
}

// Lockpicking: call every frame while key 3 is held near the vent door.
// Returns true the frame the door opens.
export function updateLockpick(tools, dt, nearDoor, holding, ventDoor) {
  if (ventDoor.open) return false;
  if (nearDoor && holding) {
    tools.lockpickProgress += dt / 2.5;
    if (tools.lockpickProgress >= 1) {
      ventDoor.open = true;
      tools.lockpickProgress = 0;
      return true;
    }
  } else {
    tools.lockpickProgress = Math.max(0, tools.lockpickProgress - dt * 0.5);
  }
  return false;
}
