#!/usr/bin/env node
/**
 * Bake the onboarding artwork exactly as the design canvas composites it.
 *
 * The design lays each illustration in a 390x470 box with
 * `object-fit: contain; object-position: 50% 0`, then softens it into the sand
 * ground with
 *
 *   radial-gradient(78% 66% at 50% 44%, #000 46%, rgba(0,0,0,.55) 74%, transparent 100%)
 *
 * as a CSS mask. React Native has no radial mask: doing it at runtime would mean
 * pulling in masked-view plus an SVG radial gradient and compositing a
 * full-width image every frame — the most expensive thing on the screen, on the
 * screen users see first. The mask is static, so it is applied here instead and
 * the app just draws a picture.
 *
 * Run after changing the source art:
 *   node tools/build-onboarding-art.mjs
 *
 * sharp does the decode/encode. It is not a dependency of this app (nothing at
 * runtime needs it), so this resolves whichever copy is already on the machine.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'assets', 'images', 'onboarding');
const OUT_DIR = path.join(SRC_DIR, 'v2');

// Design box, in the canvas's CSS pixels. Rendered at 2x for retina.
const BOX_W = 390;
const BOX_H = 470;
const SCALE = 2;

// The radial-gradient, as numbers: ellipse centred at (50%, 44%) with radii
// 78% of the width and 66% of the height, opaque to 46%, .55 at 74%, gone at 100%.
const CENTER_X = 0.5;
const CENTER_Y = 0.44;
const RADIUS_X = 0.78;
const RADIUS_Y = 0.66;
const STOPS = [
  [0.46, 1],
  [0.74, 0.55],
  [1.0, 0],
];

const FILES = ['find-artisans', 'explore-services', 'secure-booking'];

function loadSharp() {
  const require = createRequire(import.meta.url);
  const candidates = [
    'sharp',
    path.join(ROOT, '..', 'worqli-web', 'node_modules', 'sharp'),
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {
      /* try the next one */
    }
  }
  throw new Error(
    'sharp not found. Install it anywhere on the machine (npm i -g sharp) and re-run.',
  );
}

/** Alpha at a normalised elliptical distance, matching the CSS colour stops. */
function alphaAt(d) {
  if (d <= STOPS[0][0]) return STOPS[0][1];
  for (let i = 1; i < STOPS.length; i++) {
    const [d0, a0] = STOPS[i - 1];
    const [d1, a1] = STOPS[i];
    if (d <= d1) return a0 + ((d - d0) / (d1 - d0)) * (a1 - a0);
  }
  return 0;
}

const sharp = loadSharp();
const W = BOX_W * SCALE;
const H = BOX_H * SCALE;

// The mask depends only on the box, so build it once and reuse it.
const cx = CENTER_X * W;
const cy = CENTER_Y * H;
const rx = RADIUS_X * W;
const ry = RADIUS_Y * H;
const mask = new Float32Array(W * H);
for (let y = 0; y < H; y++) {
  const ny = (y - cy) / ry;
  for (let x = 0; x < W; x++) {
    const nx = (x - cx) / rx;
    mask[y * W + x] = alphaAt(Math.sqrt(nx * nx + ny * ny));
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let before = 0;
let after = 0;

for (const name of FILES) {
  const src = path.join(SRC_DIR, `${name}.webp`);
  const dst = path.join(OUT_DIR, `${name}.webp`);

  // `contain`, pinned to the top edge — the design's object-position: 50% 0.
  const { data, info } = await sharp(src)
    .resize({
      width: W,
      height: H,
      fit: 'contain',
      position: 'top',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Multiply the existing alpha (transparent padding) by the mask.
  for (let i = 0, px = 0; px < info.width * info.height; px++, i += 4) {
    data[i + 3] = Math.round(data[i + 3] * mask[px]);
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 86, alphaQuality: 92, effort: 6 })
    .toFile(dst);

  before += fs.statSync(src).size;
  after += fs.statSync(dst).size;
  console.log(`✓ ${name}.webp  ${info.width}x${info.height}`);
}

console.log(
  `source ${(before / 1024).toFixed(0)} KB → masked ${(after / 1024).toFixed(0)} KB`,
);
