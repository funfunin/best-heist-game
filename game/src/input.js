// input.js — keyboard (WASD/arrows) and mouse, one clear job: tell the
// game what the player is doing right now.

export function createInput(canvas) {
  const keys = new Set();
  const heldActionKeys = new Set(); // held-down state for action keys (e.g. lockpick)
  const ACTION_CODES = ['Digit1', 'Digit2', 'Digit3', 'KeyR', 'Enter', 'Space'];
  const state = {
    // Movement vector, normalised, recomputed each frame from held keys.
    moveX: 0,
    moveY: 0,
    // Edge-triggered actions, consumed by the game loop each frame.
    pressed: new Set(),
    mouse: { x: 0, y: 0, clicked: false },
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  window.addEventListener('keydown', (e) => {
    if (KEYMAP[e.code]) {
      keys.add(KEYMAP[e.code]);
      e.preventDefault();
    }
    if (ACTION_CODES.includes(e.code)) {
      state.pressed.add(e.code);
      heldActionKeys.add(e.code);
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]);
    if (ACTION_CODES.includes(e.code)) heldActionKeys.delete(e.code);
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    state.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    state.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    state.mouse.clicked = true;
  });

  state.update = () => {
    let x = 0, y = 0;
    if (keys.has('left')) x -= 1;
    if (keys.has('right')) x += 1;
    if (keys.has('up')) y -= 1;
    if (keys.has('down')) y += 1;
    const len = Math.hypot(x, y);
    state.moveX = len ? x / len : 0;
    state.moveY = len ? y / len : 0;
  };

  // Read and clear a one-shot key press (tools, restart, start).
  state.consume = (code) => {
    if (state.pressed.has(code)) { state.pressed.delete(code); return true; }
    return false;
  };
  // True while an action key is physically held down (lockpicking).
  state.isHeld = (code) => heldActionKeys.has(code);
  state.consumeClick = () => {
    const c = state.mouse.clicked;
    state.mouse.clicked = false;
    return c;
  };

  return state;
}
