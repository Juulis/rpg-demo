import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSheet8Rects, sheet8FrameCount, type Sheet8Json } from '../src/render/sheet8dir';

const HERO = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/2d/sprites/hero');

const DIRS = ['S', 'SV', 'V', 'NV', 'N', 'NO', 'O', 'SO'] as const;

/** En rad, en ruta per riktning (äldre idle-format utan rects i JSON). */
const singleFrameStrip: Pick<Sheet8Json, 'dirs' | 'frames' | 'frameW' | 'frameH' | 'rects'> = {
  dirs: [...DIRS],
  frameW: 64,
  frameH: 96,
  rects: undefined,
};

assert.equal(sheet8FrameCount(singleFrameStrip), 1);
const stripRects = resolveSheet8Rects(singleFrameStrip);
assert.equal(stripRects.length, 8);
assert.deepEqual(stripRects[0], { dir: 'S', frame: 0, x: 0, y: 0, w: 64, h: 96 });
assert.deepEqual(stripRects[3], { dir: 'NV', frame: 0, x: 192, y: 0, w: 64, h: 96 });

/** Åtta frames per riktning, rad per riktning (samma layout som riddare med rects). */
const eightFramesPerDir: Pick<Sheet8Json, 'dirs' | 'frames' | 'frameW' | 'frameH' | 'rects'> = {
  dirs: [...DIRS],
  frames: 8,
  frameW: 40,
  frameH: 80,
  rects: undefined,
};

assert.equal(sheet8FrameCount(eightFramesPerDir), 8);
const animRects = resolveSheet8Rects(eightFramesPerDir);
assert.equal(animRects.length, 64);
assert.deepEqual(
  animRects.find((r) => r.dir === 'S' && r.frame === 0),
  {
    dir: 'S',
    frame: 0,
    x: 0,
    y: 0,
    w: 40,
    h: 80,
  },
);
assert.deepEqual(
  animRects.find((r) => r.dir === 'S' && r.frame === 3),
  {
    dir: 'S',
    frame: 3,
    x: 120,
    y: 0,
    w: 40,
    h: 80,
  },
);
assert.deepEqual(
  animRects.find((r) => r.dir === 'NV' && r.frame === 0),
  {
    dir: 'NV',
    frame: 0,
    x: 0,
    y: 240,
    w: 40,
    h: 80,
  },
);

const riddareIdle = JSON.parse(fs.readFileSync(path.join(HERO, 'riddare_idle_8dir.json'), 'utf8')) as Pick<
  Sheet8Json,
  'dirs' | 'frames' | 'frameW' | 'frameH' | 'rects'
>;
assert.equal(sheet8FrameCount(riddareIdle), 2);
const inferred = resolveSheet8Rects({
  dirs: riddareIdle.dirs,
  frameW: riddareIdle.frameW,
  frameH: riddareIdle.frameH,
  frames: 2,
});
assert.equal(inferred.length, 16);
assert.deepEqual(
  inferred.find((r) => r.dir === 'NV' && r.frame === 0),
  riddareIdle.rects?.find((r) => r.dir === 'NV' && r.frame === 0),
);

function readHeroJson(rel: string): Sheet8Json {
  return JSON.parse(fs.readFileSync(path.join(HERO, rel), 'utf8')) as Sheet8Json;
}

for (const rel of ['amazon/amazon_idle_8dir.json', 'barbar/barbar_idle_8dir.json'] as const) {
  const meta = readHeroJson(rel);
  assert.equal(meta.frames, 8, `${rel} frames`);
  assert.equal(meta.fps, 5, `${rel} fps`);
  assert.ok(Array.isArray(meta.rects) && meta.rects.length > 0, `${rel} har rects efter grafik-PR`);
  assert.equal(sheet8FrameCount(meta), 8);
}

console.log('sheet8dir-no-rects.test.mts: ok');
