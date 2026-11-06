/**
 * R5-M2 regression: ensure 2550 chunks fit with V4+RLE compression and backcompat.
 * Verifies save + reload roundtrip for large number of revealed chunks.
 * This test is included in package.json "test" so CI runs it.
 */
import assert from 'node:assert/strict';
import { MemoryStore } from '../src/core/storage';
import { LocalStorageSaveBackend } from '../src/save/backend/LocalStorageSaveBackend';
import { FogRepository } from '../src/map/FogRepository';
import { FogOfWar } from '../src/map/FogOfWar';
import { SAVE_VERSION } from '../src/save/types';
import { worldToChunk } from '../src/world/bigWorld/bigWorldCoords';
import { TILE_WORLD } from '../src/render/Iso';

const store = new MemoryStore();
const backend = new LocalStorageSaveBackend(store);
const repo = new FogRepository(backend);

const raw = {
  version: SAVE_VERSION,
  hero: { id: 'hl', name: 'L', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: 1, killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt', bwCoordEpoch: 2 },
};
store.set('rpg_heroes', JSON.stringify([{ id: 'hl', name: 'L', cls: 'riddare', level: 1 }]));
store.set('rpg_hero_hl', JSON.stringify(raw));

await repo.prepare('hl');

const fog = new FogOfWar((zone) => repo.load('hl', zone));
fog.setWorldAnchored(true);

// Reveal origin + walk a grid of ~2550 distinct chunks.
// Chunk step in world units is 128 (64*2).
const CHUNK_STEP = 128;
const N = 2550;
// Generate a spiral or grid walk that hits distinct chunks
let revealed = 0;
const visited = new Set<string>();
function mark(wx: number, wy: number) {
  const { cx, cy } = worldToChunk(wx, wy);
  const k = `${cx},${cy}`;
  if (!visited.has(k)) {
    visited.add(k);
    revealed++;
  }
  fog.revealWorld('forest', wx, wy);
}

// seed origin
mark(0, 0);
// walk in expanding squares to get many distinct chunks
let step = 1;
let x = 0,
  y = 0;
const dirs: Array<[number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
let d = 0;
while (revealed < N) {
  for (let leg = 0; leg < 2 && revealed < N; leg++) {
    for (let s = 0; s < step && revealed < N; s++) {
      x += dirs[d][0] * CHUNK_STEP;
      y += dirs[d][1] * CHUNK_STEP;
      mark(x, y);
    }
    d = (d + 1) % 4;
  }
  step++;
}

assert.ok(revealed >= 2550, `måste ha avslöjat minst 2550 chunkar, fick ${revealed}`);

// flush via takeDirty -> repo
let savedAny = false;
for (const [zone, cells] of fog.takeDirty()) {
  if (cells && cells.length > 0) {
    const ok = await repo.save('hl', zone, cells);
    assert.ok(ok, 'save av stor dimma ska lyckas');
    savedAny = true;
  }
}
assert.ok(savedAny, 'något ska ha sparats');

// reload fresh instances
const blob = repo.load('hl', 'forest');
assert.ok(blob, 'blob ska finnas efter save');
const b0 = blob ? blob[0] : 0;
assert.ok(b0 === 4 || b0 === 3, 'V4 eller V3 efter komprimering');

const fog2 = new FogOfWar((zone) => repo.load('hl', zone));
fog2.setWorldAnchored(true);

// verify a sample of the revealed chunks are present after reload
// check origin and a few far ones
assert.ok(fog2.isWorldRevealed('forest', 0, 0), 'origin ska vara avslöjad efter reload');
assert.ok(fog2.isWorldRevealed('forest', x, y), 'sista punkten ska vara avslöjad efter reload');

// sample 100 random visited chunks via their world centers
let sampleOk = 0;
let checked = 0;
for (const k of visited) {
  if (checked > 100) break;
  const [cx, cy] = k.split(',').map(Number);
  const wx = cx * CHUNK_STEP + TILE_WORLD / 2;
  const wy = cy * CHUNK_STEP + TILE_WORLD / 2;
  if (fog2.isWorldRevealed('forest', wx, wy)) sampleOk++;
  checked++;
}
assert.ok(sampleOk > 50, 'ett urval av chunkar ska vara avslöjade efter reload');

console.log(`fog-large-save.test.mts: ok (${revealed} chunkar, blob len=${blob ? blob.length : 0})`);
