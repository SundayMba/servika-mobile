#!/usr/bin/env node
/**
 * Capture a screen from the running app, by route name.
 *
 *   node tools/capture.mjs login
 *   node tools/capture.mjs /booking/request booking-request
 *   node tools/capture.mjs --list
 *
 * Every expo-router route is reachable as a deep link because app.json sets
 * `scheme: servika`, so naming a screen is enough — no tapping through the app.
 * Route groups such as (auth) and (tabs) do not appear in the URL: the file
 * app/(auth)/login.tsx is simply /login.
 *
 * Needs a debug build installed and Metro running (`npx expo start`). The script
 * sets up `adb reverse` itself so a USB device can reach Metro on the host.
 *
 * Shots land in design/screens/<name>.png, which is where the Claude Design
 * sync reads from.
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'design', 'screens');

// Read identity from app.json so this file is identical in both apps — the
// customer app (servika / com.mba001.servika) and Servika Pro
// (servikapro / com.mba001.servikapro).
const APP = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo;
const PACKAGE = APP.android?.package;
const SCHEME = APP.scheme;
if (!PACKAGE || !SCHEME) {
  throw new Error('app.json needs both expo.scheme and expo.android.package.');
}

// A debug build always asks for its dev server on DEVICE_PORT (8081 unless the
// build overrode it). `adb reverse` forwards that to a port on this machine, so
// two apps can be served at once: run the second app's Metro on 8082 and set
// RCT_METRO_HOST_PORT=8082. Without this, whichever Expo CLI last saw the device
// resets the tunnel to 8081->8081 and the app silently loads the OTHER app's
// bundle — which looks like "this route doesn't exist" rather than an error.
const DEVICE_PORT = Number(process.env.RCT_METRO_PORT ?? 8081);
const HOST_PORT = Number(process.env.RCT_METRO_HOST_PORT ?? DEVICE_PORT);
/** Time for the router to settle and the screen to paint before the capture. */
const SETTLE_MS = 1400;

const SDK =
  process.env.ANDROID_HOME ??
  process.env.ANDROID_SDK_ROOT ??
  path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');
const ADB = path.join(SDK, 'platform-tools', 'adb');

function adb(args, opts = {}) {
  return execFileSync(ADB, args, { encoding: 'buffer', ...opts });
}
function adbText(args) {
  return adb(args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

/** Every route file under app/, as the deep-link path it answers to. */
function listRoutes() {
  const routes = [];
  const walk = (dir, urlParts) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // (groups) structure the files but never appear in the URL.
        const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')');
        walk(full, isGroup ? urlParts : [...urlParts, entry.name]);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      const base = entry.name.replace(/\.tsx?$/, '');
      if (base.startsWith('_') || base.startsWith('+')) continue;
      const parts = base === 'index' ? urlParts : [...urlParts, base];
      routes.push('/' + parts.join('/'));
    }
  };
  walk(path.join(ROOT, 'app'), []);
  return [...new Set(routes)].sort();
}

function pickDevice() {
  const lines = adbText(['devices']).split(/\r?\n/).slice(1).filter(Boolean);
  const ready = lines
    .map((l) => l.split(/\s+/))
    .filter(([, state]) => state === 'device')
    .map(([serial]) => serial);
  if (!ready.length) {
    throw new Error('No device. Plug in a phone with USB debugging, or start an emulator.');
  }
  if (process.env.ANDROID_SERIAL && ready.includes(process.env.ANDROID_SERIAL)) {
    return process.env.ANDROID_SERIAL;
  }
  return ready[0];
}

const argv = process.argv.slice(2);

// --wait MS overrides the settle time. The first capture after Metro starts
// needs far longer than later ones, because the bundle is still being built —
// shoot too early and you photograph an empty brand-coloured screen.
let settleMs = SETTLE_MS;
const waitAt = argv.indexOf('--wait');
if (waitAt !== -1) {
  settleMs = Number(argv[waitAt + 1]);
  if (!Number.isFinite(settleMs) || settleMs < 0) {
    console.error('--wait needs milliseconds, e.g. --wait 20000');
    process.exit(1);
  }
  argv.splice(waitAt, 2);
}

// --slides N captures a paged carousel: shoot, swipe, shoot, ... N times.
let slides = 1;
const slidesAt = argv.indexOf('--slides');
if (slidesAt !== -1) {
  slides = Number(argv[slidesAt + 1]);
  if (!Number.isInteger(slides) || slides < 1) {
    console.error('--slides needs a positive integer, e.g. --slides 3');
    process.exit(1);
  }
  argv.splice(slidesAt, 2);
}

const args = argv;

if (args.includes('--list') || args.length === 0) {
  console.log('Routes you can capture:\n');
  for (const r of listRoutes()) console.log('  ' + r);
  console.log('\nUsage: node tools/capture.mjs <route> [name]');
  process.exit(args.length === 0 ? 1 : 0);
}

/**
 * Resolve what the user typed against the real route table.
 *
 * This also undoes Git Bash's argument mangling: MSYS rewrites a leading-slash
 * argument like `/login` into `C:/Program Files/Git/login`, so matching on the
 * trailing segments is what makes both shells behave the same. A typo gets the
 * route list back instead of a screenshot of whatever happened to be on screen.
 */
function resolveRoute(input) {
  const routes = listRoutes();
  const cleaned = input.replace(/\\/g, '/').replace(/^\/+/, '');
  if (routes.includes('/' + cleaned)) return '/' + cleaned;

  const typed = cleaned.toLowerCase();
  const matches = routes.filter((r) => {
    const bare = r.slice(1).toLowerCase();
    if (!bare) return false;
    // `bare.endsWith(typed)` catches a partial route ("request" -> booking/request);
    // `typed.endsWith(bare)` catches MSYS's prepended install path.
    return bare === typed || bare.endsWith('/' + typed) || typed.endsWith('/' + bare);
  });
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`"${input}" is ambiguous:\n  ${matches.join('\n  ')}`);
  }
  throw new Error(
    `No route matches "${input}". Run with --list to see all ${routes.length}.`,
  );
}

let route;
try {
  route = resolveRoute(args[0]);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const name = (args[1] ?? (route.replace(/^\//, '').replace(/\//g, '-') || 'index'))
  // Dynamic segments like [id] are not filename-safe on Windows.
  .replace(/[[\]]/g, '');

const serial = pickDevice();
const model = adbText(['-s', serial, 'shell', 'getprop', 'ro.product.model']);

// A debug build loads its JS from Metro; over USB that needs a reverse tunnel.
// Re-asserted on every run because a running Expo CLI reclaims it for its own app.
try {
  adb(['-s', serial, 'reverse', `tcp:${DEVICE_PORT}`, `tcp:${HOST_PORT}`], { stdio: 'ignore' });
} catch {
  console.warn('! Could not set up adb reverse — continuing, Metro may be unreachable.');
}
// A stale bundle from the other app survives a plain deep link, so start clean.
adb(['-s', serial, 'shell', 'am', 'force-stop', PACKAGE], { stdio: 'ignore' });

const url = `${SCHEME}://${route}`;
console.log(`→ ${model} (${serial})`);
console.log(`→ ${url}  (device:${DEVICE_PORT} → host:${HOST_PORT})`);

adb(
  ['-s', serial, 'shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW', '-d', url, PACKAGE],
  { stdio: 'ignore' },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(settleMs);

fs.mkdirSync(OUT_DIR, { recursive: true });

function shoot(dest) {
  const png = adb(['-s', serial, 'exec-out', 'screencap', '-p']);
  if (png.length < 1000 || png.slice(1, 4).toString() !== 'PNG') {
    throw new Error('screencap did not return a PNG — is the screen locked?');
  }
  fs.writeFileSync(dest, png);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  console.log(
    `✓ ${path.relative(ROOT, dest)}  ${width}x${height}  ${(png.length / 1024).toFixed(0)} KB`,
  );
  return { width, height };
}

if (slides === 1) {
  shoot(path.join(OUT_DIR, `${name}.png`));
} else {
  let size = null;
  for (let i = 1; i <= slides; i++) {
    size = shoot(path.join(OUT_DIR, `${name}-${i}.png`));
    if (i === slides) break;
    // Swipe right-to-left across the middle of the screen to page forward.
    const y = Math.round(size.height * 0.5);
    const from = Math.round(size.width * 0.85);
    const to = Math.round(size.width * 0.15);
    adb(
      ['-s', serial, 'shell', 'input', 'swipe', String(from), String(y), String(to), String(y), '250'],
      { stdio: 'ignore' },
    );
    // Let the pager snap and any entrance animation finish.
    await sleep(900);
  }
}
