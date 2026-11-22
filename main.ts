// Night Gallery Heist — entrypoint (Node 22, standard library only).
//
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and
// no network request). This program hands it in: it copies game/ and
// screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library (vendor/makefun-game.ts, unchanged from the kit).
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate refuses an entry with no screenshots or a dossier over 1.5 MiB,
// so fail loudly here instead of handing in a broken output.
const shotDir = join(here, 'screenshots');
const shots = existsSync(shotDir)
  ? readdirSync(shotDir).filter((f) => !f.startsWith('.') && statSync(join(shotDir, f)).isFile())
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const bytes = statSync(join(shotDir, shot)).size;
  if (bytes > 262144) throw new Error(`screenshot ${shot} is ${bytes} bytes, over the 256 KiB cap`);
}

// The gate also refuses an entry whose game/ has no index.html, so check
// the entrypoint of the game itself before copying anything.
const gameDir = join(here, 'game');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('game/index.html is missing');
}
const gameFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else gameFiles.push(p);
  }
})(gameDir);
const gameBytes = gameFiles.reduce((n, f) => n + statSync(f).size, 0);
if (gameFiles.length > 993) throw new Error(`game/ holds ${gameFiles.length} files, over the 993 cap`);
if (gameBytes > 50331648) throw new Error(`game/ is ${gameBytes} bytes, over the 48 MiB cap`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes: game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
if (Buffer.byteLength(dossier, 'utf8') > 1572864) {
  throw new Error('dossier.json exceeds the 1.5 MiB gate cap');
}
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`wrote ${join(out, 'dossier.json')} (${Buffer.byteLength(dossier, 'utf8')} bytes, ${shots.length} screenshots, game/ ${gameFiles.length} files / ${gameBytes} bytes)`);
