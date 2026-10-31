import assert from 'node:assert/strict';
import { migrateBigWorldKillIds } from '../src/world/bigWorld/saveCoordMigrate';
import { parseBigWorldSpawnUid } from '../src/world/bigWorld/bigWorldCoords';
import { SaveMigrator } from '../src/save/SaveMigrator';

const old = 'bw:0,0:1:skogsvarg';
const migrated = migrateBigWorldKillIds([old])[0];
assert.ok(migrated);
const p = parseBigWorldSpawnUid(migrated);
assert.ok(p);
assert.equal(p.cx, 1);
assert.equal(p.cy, 1);

const m = new SaveMigrator();
const save = m.migrate({
  version: 2,
  hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: 1, killed: [old], zone: 'forest', pos: [0, 0], stage: 0, runes: 0, city: 'besatt' },
});
assert.ok(save?.game?.killed.includes('bw:1,1:1:skogsvarg'));
assert.equal(save?.game?.bwCoordEpoch, 2);

console.log('save-bw-coord-migrate.test.mts: ok');
