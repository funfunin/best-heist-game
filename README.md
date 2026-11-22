[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/funfunin/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/funfunin/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# Night Gallery Heist

A top-down stealth heist game in a single museum gallery at night. You are
the thief: slip past three patrolling guards and their sweeping vision
cones, dodge the wall cameras, steal the Velvet Star, and get out through
the EXIT before the alarm meter hits 100%.

## How to play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and
open http://localhost:8080). No network, no build step — plain static files.

- **WASD / arrow keys** — move the thief
- **1 — Noisemaker** (costs 1 coin): lures the nearest guard to your spot
- **2 — Smoke puff** (costs 1 coin): blocks vision cones and camera beams
  around you for 4 seconds
- **3 — Lockpick**: hold it near the locked vent door to open a shortcut
- **R** — restart after a win or a capture; **Enter / click** — start

## Routes and rules

- **Main hall** (the red carpet): fast, but crossed by every patrol.
- **Dark south corridor**: cameras only, no guards — slow and quiet.
- **Vent shortcut**: locked until you pick it; the fastest line to the gem.
- Coins in the display cases pay for your tools. A guard's cone shows a
  red `!` and a short grace window before the alarm starts climbing;
  cameras raise it more slowly but never blink. The alarm decays while
  you stay unseen.
- **Win**: grab the ★ Velvet Star, then reach the green EXIT.
  **Lose**: the alarm reaches 100% and the guards close in.
- Score: loot + time bonus + alarm left over.

All art is drawn in code on a canvas and all sounds are tiny WebAudio
synth blips — no copied assets, no external files.
