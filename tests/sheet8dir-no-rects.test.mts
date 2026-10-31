import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSheet8Rects, sheet8FrameCount } from '../src/render/sheet8dir';

const HERO = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/2d/sprites/hero');

function readJson(rel: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(HERO, rel), 'utf8'));
}

const amazonIdle = readJson('amazon/amazon_idle_8dir.json') as {
  frameW: number;
  frameH: number;
  dirs: string[];
  frames?: number;
  rects?: unknown[];
};
assert.equal(sheet8FrameCount(amazonIdle), 1);
assert.equal(amazonIdle.rects, undefined);
const amazonRects = resolveSheet8Rects(amazonIdle);
assert.equal(amazonRects.length, 8);
assert.deepEqual(amazonRects[0], { dir: 'S', frame: 0, x: 0, y: 0, w: 177, h: 310 });
assert.deepEqual(amazonRects[3], { dir: 'NV', frame: 0, x: 531, y: 0, w: 177, h: 310 });

const barbarIdle = readJson('barbar/barbar_idle_8dir.json') as {
  frameW: number;
  frameH: number;
  dirs: string[];
};
const barbarRects = resolveSheet8Rects(barbarIdle);
assert.equal(barbarRects.length, 8);
assert.equal(barbarRects[7]?.x, 7 * 245);

const riddareIdle = readJson('riddare_idle_8dir.json') as {
  frameW: number;
  frameH: number;
  dirs: string[];
  frames?: number;
  rects: { dir: string; frame?: number; x: number; y: number; w: number; h: number }[];
};
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
  {
    dir: 'NV',
    frame: 0,
    x: 0,
    y: 435,
    w: 142,
    h: 145,
  },
);
assert.deepEqual(
  riddareIdle.rects.find((r) => r.dir === 'NV' && r.frame === 0),
  inferred.find((r) => r.dir === 'NV' && r.frame === 0),
);

console.log('sheet8dir-no-rects.test.mts: ok');
