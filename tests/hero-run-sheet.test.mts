import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sheet8FrameCount } from '../src/render/sheet8dir';

const HERO = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/2d/sprites/hero');

function readRun(name: string): { frames: number; fps: number; frameW: number; frameH: number; anchor: [number, number] } {
  const meta = JSON.parse(fs.readFileSync(path.join(HERO, name), 'utf8')) as {
    frames?: number;
    fps?: number;
    frameW: number;
    frameH: number;
    anchor: [number, number];
    rects: { frame?: number }[];
  };
  return {
    frames: sheet8FrameCount(meta),
    fps: meta.fps ?? 0,
    frameW: meta.frameW,
    frameH: meta.frameH,
    anchor: meta.anchor,
  };
}

const riddare = readRun('riddare_run_8dir.json');
assert.equal(riddare.frames, 12);
assert.equal(riddare.fps, 28);
assert.deepEqual(riddare.anchor, [166, 290]);
assert.equal(riddare.frameW, 333);
assert.equal(riddare.frameH, 300);

const amazon = readRun('amazon/amazon_run_8dir.json');
assert.equal(amazon.frames, 12);
assert.equal(amazon.fps, 28);
assert.deepEqual(amazon.anchor, [134, 319]);

const barbar = readRun('barbar/barbar_run_8dir.json');
assert.equal(barbar.frames, 12);
assert.equal(barbar.fps, 28);
assert.deepEqual(barbar.anchor, [130, 286]);

console.log('hero-run-sheet.test.mts: ok');
