import assert from 'node:assert/strict';
import { Container as PixiContainer, Texture } from 'pixi.js';
import { BIG_WORLD_GROUND_PATCH_TILES, BIG_WORLD_RENDER_RADIUS } from '../src/world/bigWorld/bigWorldConfig';
import { chunkTileCount, chunkWorldSpan } from '../src/world/bigWorld/bigWorldCoords';
import { BigWorldStreamGround, patchLayerUsable } from '../src/world/bigWorld/BigWorldStreamGround';
import { Zone } from '../src/world/Zone';
import type { AssetStore } from '../src/render/Assets';

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

const tex = Texture.EMPTY;
const assets = {
  tiles: new Map([['gras_1', tex]]),
  decor: new Map(),
  decorAnims: new Map(),
} as unknown as AssetStore;
const zone = new Zone('forest', 'startskogen', 4096, 4096);
zone.bigWorldStreaming = true;
const objects = new PixiContainer();
const ground = new BigWorldStreamGround(assets);
objects.addChild(ground);
const span = chunkWorldSpan();
const hero = { x: span * 1.5, y: span * 1.5 };
const view = { minX: hero.x - span, minY: hero.y - span, maxX: hero.x + span, maxY: hero.y + span };
for (let i = 0; i < 40 && !ground.isGroundReady(); i++) {
  ground.sync(hero, 42, 99, { objects, zone }, {} as import('pixi.js').Renderer, view);
}
assert.ok(ground.countGroundDisplayObjects() > 0, 'BigWorldStreamGround ska bygga mark-sprites via sync/tickBuildBudget');
ground.destroy({ children: true });

console.log('big-world-ground-bake.test.mts: ok', { visibleChunks, patchesPerChunk, bake: 'sprites' });
