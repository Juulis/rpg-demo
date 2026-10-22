import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Texture } from 'pixi.js';
import { animBodyHeight, animDisplayScale, animSetRefHeight } from '../src/render/spriteLayout';
import type { Anim, AnimSet } from '../src/render/spriteAnim';

const HERO_SCALE = 0.55;
const DISPLAY_K = 1;
const TOL = 2;
const HERO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/2d/sprites/hero');

function readSheet(name: string): { w: number; h: number; anchor: [number, number] } {
  const meta = JSON.parse(fs.readFileSync(path.join(HERO_DIR, `${name}.json`), 'utf8')) as {
    frameW: number;
    frameH: number;
    anchor: [number, number];
  };
  return { w: meta.frameW, h: meta.frameH, anchor: meta.anchor };
}

function animFromMeta(w: number, h: number, anchor: [number, number], scale = HERO_SCALE): Anim {
  return {
    frames: [[Texture.EMPTY]],
    anchor,
    w,
    h,
    fps: 10,
    loop: true,
    scale,
  };
}

function assertUniformHeights(set: AnimSet, label: string): void {
  const refH = animSetRefHeight(set);
  const names = ['idle', 'gang', 'run', 'attack', 'dod'] as const;
  const heights: number[] = [];
  for (const n of names) {
    const a = set[n];
    if (!a) continue;
    const frameH = a.h * animDisplayScale(DISPLAY_K, refH, a);
    assert.ok(Math.abs(frameH - refH * DISPLAY_K * (a.scale ?? 1)) < 0.02, `${label} ${n} frameH`);
    heights.push(animBodyHeight(DISPLAY_K, refH, a));
  }
  assert.ok(heights.length >= 2, `${label}: behöver minst två animationer`);
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  assert.ok(max - min <= TOL, `${label}: kroppshöjd ${min.toFixed(1)}..${max.toFixed(1)} (tol ${TOL})`);
}

function sheetAnim(name: string): Anim {
  const m = readSheet(name);
  return animFromMeta(m.w, m.h, m.anchor);
}

const walkM = readSheet('riddare_walk_8dir');
const runM = readSheet('riddare_run_8dir');
const riddare: AnimSet = {
  idle: sheetAnim('riddare_idle_8dir'),
  gang: sheetAnim('riddare_walk_8dir'),
  run: sheetAnim('riddare_run_8dir'),
  attack: sheetAnim('riddare_attack_8dir'),
  dod: sheetAnim('riddare_dodge_8dir'),
};
assertUniformHeights(riddare, 'riddare');
assert.ok(runM.h > walkM.h * 1.05, 'run-ruta större än walk');

for (const cls of ['amazon', 'barbar'] as const) {
  const prefix = cls === 'amazon' ? 'amazon' : 'barbar';
  const folder = path.join(HERO_DIR, cls);
  if (!fs.existsSync(folder)) continue;
  const set: AnimSet = {};
  for (const stem of ['idle', 'walk', 'run', 'attack', 'dodge'] as const) {
    const p = path.join(folder, `${prefix}_${stem}_8dir.json`);
    if (!fs.existsSync(p)) continue;
    const m = JSON.parse(fs.readFileSync(p, 'utf8')) as { frameW: number; frameH: number; anchor: [number, number] };
    const anim = animFromMeta(m.frameW, m.frameH, m.anchor);
    if (stem === 'walk') set.gang = anim;
    else if (stem === 'idle') set.idle = anim;
    else if (stem === 'run') set.run = anim;
    else if (stem === 'attack') set.attack = anim;
    else set.dod = anim;
  }
  if (set.gang) assertUniformHeights(set, prefix);
}

console.log('sprite-uniform-scale.test.mts: ok');
