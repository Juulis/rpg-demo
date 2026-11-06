import assert from 'node:assert/strict';
import { chunkMinWorld, chunkWorldSpan, worldToChunk } from '../src/world/bigWorld/bigWorldCoords';
import { patchWorldBounds } from '../src/world/bigWorld/groundPatchBounds';
import { TILE_WORLD } from '../src/render/Iso';

const span = chunkWorldSpan();
const tiles = 64;

assert.equal(worldToChunk(0, 0).cx, 1);
assert.equal(worldToChunk(0, 0).cy, 1);

const min11 = chunkMinWorld(1, 1);
assert.ok(min11.x <= 0 && min11.x + span > 0, 'chunk [1,1] ska täcka origo i x');
assert.ok(min11.y <= 0 && min11.y + span > 0, 'chunk [1,1] ska täcka origo i y');

const min00 = chunkMinWorld(0, 0);
const b = patchWorldBounds(0, 0, 0, 0, 16, tiles);
assert.equal(b.minX, min00.x);
assert.equal(b.minY, min00.y);

const neg = chunkMinWorld(-2, -1);
assert.ok(neg.x < -128, 'negativ chunk ska ligga väster om origo');
const heroWx = 0;
const heroWy = 4;
const { cx, cy } = worldToChunk(heroWx, heroWy);
const hmin = chunkMinWorld(cx, cy);
assert.ok(hmin.x <= heroWx && heroWx < hmin.x + span);
assert.ok(hmin.y <= heroWy && heroWy < hmin.y + span);
const ti = Math.floor((heroWx - hmin.x) / TILE_WORLD);
const tj = Math.floor((heroWy - hmin.y) / TILE_WORLD);
const pi = Math.floor(ti / 16);
const pj = Math.floor(tj / 16);
const patch = patchWorldBounds(cx, cy, pi, pj, 16, tiles);
assert.ok(patch.minX <= heroWx && heroWx < patch.maxX);
assert.ok(patch.minY <= heroWy && heroWy < patch.maxY);

console.log('big-world-ground-coords.test.mts: ok');
