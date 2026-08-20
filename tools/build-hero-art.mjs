#!/usr/bin/env node
/**
 * Cut the hero artisans out of their baked-in orange and feather the edges.
 *
 * The source heroes are photographed on a flat #F97316 field, which used to be
 * invisible because the whole hero canopy was that exact orange. v2 makes the
 * hero card #E4620A, so that field now reads as a lighter rectangle sitting on
 * top of the card — the hard edge you can see mid-carousel.
 *
 * Rather than tie the card's colour to the artwork forever, the background is
 * removed here so the images composite over any surface:
 *
 *  1. Flood-fill inwards from the border, taking only pixels close to the corner
 *     colour. A global colour key would also punch holes in the orange tool
 *     handles and safety gear; only the region actually connected to the edge is
 *     background.
 *  2. Blur the resulting alpha a little, so the cutout has a soft edge instead
 *     of a jagged one.
 * The canvas also shows a radial falloff over the image, but that is applied
 * there to a box that deliberately overflows the card. Squaring it onto the
 * source erases most of the subject, and the card already clips with
 * overflow:hidden — so the cut-out plus a soft edge is what actually delivers
 * the single continuous background.
 *
 * Run after changing the hero art:
 *   node tools/build-hero-art.mjs
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(ROOT, 'assets', 'images', 'artisans', 'working');
const OUT_DIR = path.join(SRC_DIR, 'v2');

/** Rendered at 186pt tall; 560 covers 3x density. */
const SIZE = 560;
/** How far a pixel may sit from the corner colour and still count as backdrop. */
const KEY_TOLERANCE = 52;
/** Softens the cutout edge. */
const EDGE_BLUR = 1.6;

const FILES = fs
  .readdirSync(SRC_DIR)
  .filter((f) => f.startsWith('hero_') && f.endsWith('.webp'));

function loadSharp() {
  const require = createRequire(import.meta.url);
  for (const c of ['sharp', path.join(ROOT, '..', 'worqli-web', 'node_modules', 'sharp')]) {
    try {
      return require(c);
    } catch {
      /* next */
    }
  }
  throw new Error('sharp not found. Install it anywhere (npm i -g sharp) and re-run.');
}

const sharp = loadSharp();
fs.mkdirSync(OUT_DIR, { recursive: true });

let before = 0;
let after = 0;

for (const name of FILES) {
  const srcPath = path.join(SRC_DIR, name);
  const src = fs.readFileSync(srcPath);
  before += src.length;

  const { data, info } = await sharp(src)
    .resize(SIZE, SIZE, { fit: 'cover' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: W, height: H } = info;
  const at = (x, y) => (y * W + x) * 4;

  // The corner is background by definition — key against it rather than a
  // hard-coded hex, so a re-shot hero with a slightly different orange works.
  const key = [data[0], data[1], data[2]];
  const near = (i) =>
    Math.abs(data[i] - key[0]) + Math.abs(data[i + 1] - key[1]) + Math.abs(data[i + 2] - key[2]) <
    KEY_TOLERANCE;

  // Flood fill inwards from every border pixel.
  const isBackdrop = new Uint8Array(W * H);
  const queue = [];
  const push = (x, y) => {
    const p = y * W + x;
    if (isBackdrop[p]) return;
    if (!near(at(x, y))) return;
    isBackdrop[p] = 1;
    queue.push(p);
  };
  for (let x = 0; x < W; x++) {
    push(x, 0);
    push(x, H - 1);
  }
  for (let y = 0; y < H; y++) {
    push(0, y);
    push(W - 1, y);
  }
  while (queue.length) {
    const p = queue.pop();
    const x = p % W;
    const y = (p - x) / W;
    if (x > 0) push(x - 1, y);
    if (x < W - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < H - 1) push(x, y + 1);
  }

  // Alpha channel on its own, so it can be blurred without smearing colour.
  const alpha = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) alpha[p] = isBackdrop[p] ? 0 : 255;

  // sharp does not promise to hand a single-channel buffer back unchanged, and
  // assuming it does desynchronises the read: the alpha drifts row by row and
  // the subject comes out banded and half-transparent. Read the real stride.
  const blurred = await sharp(alpha, { raw: { width: W, height: H, channels: 1 } })
    .blur(EDGE_BLUR)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const stride = blurred.info.channels;

  for (let p = 0; p < W * H; p++) data[p * 4 + 3] = blurred.data[p * stride];

  const out = path.join(OUT_DIR, name);
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 84, alphaQuality: 100, effort: 6 })
    .toFile(out);

  const cut = isBackdrop.reduce((a, b) => a + b, 0) / (W * H);
  after += fs.statSync(out).size;
  console.log(`✓ ${name}  ${(cut * 100).toFixed(0)}% keyed out`);
}

console.log(`source ${(before / 1024).toFixed(0)} KB → cut out ${(after / 1024).toFixed(0)} KB`);
