// level.js — the museum floor: walls, cover, loot, exit, patrol routes.
// One room, three routes: the guarded main hall, the dark south corridor,
// and the locked vent shortcut. All coordinates are canvas pixels (960x640).

export const LEVEL = {
  width: 960,
  height: 640,
  // The thief enters through the service door at the bottom-left and must
  // leave through the same exit carrying the Velvet Star.
  exit: { x: 52, y: 588, w: 72, h: 40 },
  start: { x: 88, y: 560 },
  // The target loot, in its glass case at the far end of the main hall.
  gem: { x: 880, y: 96, r: 16 },
  // Small optional loot: coins in display cases.
  coins: [
    { x: 300, y: 130, r: 10, taken: false },
    { x: 620, y: 330, r: 10, taken: false },
    { x: 430, y: 520, r: 10, taken: false },
  ],
};

// Solid rectangles the thief and guards cannot cross. The room is ringed
// by walls; the interior blocks are display cases and pillars (cover).
export const WALLS = [
  // Outer ring (with a gap at the exit door, bottom-left).
  { x: 0, y: 0, w: 960, h: 24 },
  { x: 0, y: 0, w: 24, h: 640 },
  { x: 936, y: 0, w: 24, h: 640 },
  { x: 0, y: 616, w: 24, h: 24 },
  { x: 124, y: 616, w: 836, h: 24 },
  // Interior: display cases (glass, block sight) and pillars.
  { x: 200, y: 90, w: 120, h: 46 },   // case row, north-west
  { x: 560, y: 90, w: 120, h: 46 },   // case row, north-east
  { x: 380, y: 250, w: 46, h: 130 },  // central pillar
  { x: 200, y: 420, w: 120, h: 46 },  // case row, south-west
  { x: 620, y: 420, w: 120, h: 46 },  // case row, south-east
  { x: 760, y: 250, w: 46, h: 130 },  // pillar, east hall
];

// The vent shortcut: a locked service door in the north wall of the
// corridor. Lockpicking it (hold 3 near it) opens a fast, dark route to
// the gem. Until opened it is a solid wall.
export const VENT_DOOR = { x: 470, y: 196, w: 60, h: 14, open: false };

// Guard patrol routes. Each guard walks its waypoints and pauses at each,
// sweeping its vision cone while it waits.
export const PATROLS = [
  {
    name: 'Mara',
    speed: 62,
    waypoints: [
      { x: 300, y: 200 }, { x: 660, y: 200 }, { x: 660, y: 330 }, { x: 300, y: 330 },
    ],
    pause: 1.1,
  },
  {
    name: 'Ivo',
    speed: 55,
    waypoints: [
      { x: 820, y: 200 }, { x: 820, y: 470 }, { x: 560, y: 470 }, { x: 560, y: 200 },
    ],
    pause: 1.4,
  },
  {
    name: 'Sable',
    speed: 48,
    waypoints: [
      { x: 140, y: 500 }, { x: 480, y: 500 }, { x: 480, y: 560 }, { x: 140, y: 560 },
    ],
    pause: 0.9,
  },
];

// Wall-mounted security cameras. Each sweeps a fixed arc; being caught in
// its beam raises the alarm.
export const CAMERAS = [
  { x: 480, y: 30, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.55, range: 240, halfAngle: 0.30 },
  { x: 930, y: 320, baseAngle: Math.PI, sweep: 0.7, speed: 0.45, range: 220, halfAngle: 0.28 },
  { x: 30, y: 320, baseAngle: 0, sweep: 0.7, speed: 0.5, range: 200, halfAngle: 0.28 },
];

// Rectangles that block line of sight for cones and cameras (walls do).
export function blocksSight(x, y) {
  for (const w of WALLS) {
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return true;
  }
  if (!VENT_DOOR.open && x >= VENT_DOOR.x && x <= VENT_DOOR.x + VENT_DOOR.w &&
      y >= VENT_DOOR.y && y <= VENT_DOOR.y + VENT_DOOR.h) return true;
  return false;
}

// True when the segment from (x1,y1) to (x2,y2) crosses no sight blocker.
export function hasLineOfSight(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSight(x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

// Circle-vs-rectangle collision used by the thief and the guards.
export function circleHitsWall(x, y, r) {
  for (const w of WALLS) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  if (!VENT_DOOR.open) {
    const d = VENT_DOOR;
    const cx = Math.max(d.x, Math.min(x, d.x + d.w));
    const cy = Math.max(d.y, Math.min(y, d.y + d.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
