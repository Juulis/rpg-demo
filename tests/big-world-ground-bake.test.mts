import assert from 'node:assert/strict';
import { BIG_WORLD_GROUND_PATCH_TILES, BIG_WORLD_RENDER_RADIUS } from '../src/world/bigWorld/bigWorldConfig';
import { chunkTileCount } from '../src/world/bigWorld/bigWorldCoords';

const tiles = chunkTileCount();
const side = Math.ceil(tiles / BIG_WORLD_GROUND_PATCH_TILES);
const patchesPerChunk = side * side;
const visibleChunks = (2 * BIG_WORLD_RENDER_RADIUS + 1) ** 2;
const maxRtIfAllVisible = visibleChunks * patchesPerChunk;

assert.equal(patchesPerChunk, 16, '64×64 chunk ska delas i 16 patchar à 16×16');
assert.ok(maxRtIfAllVisible <= 400, `render-radie ska capa RT (~${maxRtIfAllVisible})`);

console.log('big-world-ground-bake.test.mts: ok', { maxRtIfAllVisible, patchesPerChunk });
