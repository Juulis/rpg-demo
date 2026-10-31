import assert from 'node:assert/strict';
import { BIG_WORLD_GROUND_PATCH_TILES, BIG_WORLD_RENDER_RADIUS } from '../src/world/bigWorld/bigWorldConfig';
import { chunkTileCount } from '../src/world/bigWorld/bigWorldCoords';
import { patchLayerUsable } from '../src/world/bigWorld/BigWorldStreamGround';
import { Container as PixiContainer } from 'pixi.js';

const tiles = chunkTileCount();
const side = Math.ceil(tiles / BIG_WORLD_GROUND_PATCH_TILES);
const patchesPerChunk = side * side;
const visibleChunks = (2 * BIG_WORLD_RENDER_RADIUS + 1) ** 2;

assert.ok(patchesPerChunk >= 1);
assert.equal(patchesPerChunk, 16, '64×64 chunk delas i 16 byggbatchar à 16×16');

const layer = new PixiContainer();
assert.ok(patchLayerUsable(layer));
layer.destroy({ children: true });
assert.equal(patchLayerUsable(layer), false, 'förstört lager ska inte bakas');

console.log('big-world-ground-bake.test.mts: ok', { visibleChunks, patchesPerChunk, bake: 'off' });
