import assert from 'node:assert/strict';
import { DATA, validateData } from '../src/data';
import { validateVarldStor, filterKnownVarldStorDataDebt } from '../src/data/validateVarldStor';
import { validateVarldStorSpawnScan } from '../src/data/validateVarldStorSpawnScan';
import { buildBigWorldCatalog, generateChunkWorldData } from '../src/world/bigWorld/worldGenerator';
import { ChunkWorldCache } from '../src/world/bigWorld/chunkCache';

const ctx = {
  monsterIds: new Set(DATA.families.monsters.map((m) => m.id)),
  monsterById: new Map(DATA.families.monsters.map((m) => [m.id, m])),
  familyIds: new Set(DATA.families.families.map((f) => f.id)),
};

function filterKnownVarldStorIssues(issues: string[]): string[] {
  return filterKnownVarldStorDataDebt(issues);
}

assert.ok(
  !validateVarldStor(DATA.varldStor, ctx).some((i) => i.includes('egna_monster fjall_bergsulvar')),
  'fjall_bergsulvar ska ha korrekt familj efter design-sync',
);
assert.equal(filterKnownVarldStorIssues(validateVarldStor(DATA.varldStor, ctx)).length, 0);

assert.equal(validateVarldStorSpawnScan(DATA.varldStor, ctx, { seeds: [5], radius: 16, maxRing: 7 }).length, 0);

assert.throws(() => new ChunkWorldCache({ maxEntries: 48, keepRadius: 3 }));
const cache = new ChunkWorldCache({ maxEntries: 49, keepRadius: 3 });
const objs = new Set<object>();
for (let i = 0; i < 5; i++) {
  cache.syncNear(1, 1, i * 10, 0);
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      objs.add(cache.get(1, 1, i * 10 + dx, dy));
    }
  }
}
assert.equal(objs.size, 5 * 49, 'syncNear ska inte återanvända chunkobjekt inom keep');

const tight = new ChunkWorldCache({ maxEntries: 9, keepRadius: 1 });
for (let i = 0; i < 8; i++) tight.get(1, 1, i, 0);
assert.ok(tight.size() <= 9);
const pinned = tight.get(1, 1, 99, 0);
assert.equal(pinned.cx, 99);
assert.ok(tight.size() <= 9);

const broken = structuredClone(DATA.varldStor);
const firstRegion = broken.regioner[0];
assert.ok(firstRegion);
broken.regioner.push({ ...firstRegion, id: firstRegion.id });
const issues = validateVarldStor(broken, ctx);
assert.ok(issues.some((i) => i.includes('dubblerat region-id')));

const brokenSlot = structuredClone(DATA.varldStor);
const fjall = brokenSlot.biomer.fjall;
assert.ok(fjall?.egna_monster);
const slot = fjall.egna_monster.find((s) => s.id === 'fjall_gruvkryp');
assert.ok(slot);
slot.familj = 'bestar';
const slotIssues = validateVarldStor(brokenSlot, ctx);
assert.ok(slotIssues.some((i) => i.includes('egna_monster fjall_gruvkryp') && i.includes('tillhör')));

const stripped = structuredClone(DATA.varldStor);
stripped.biomer.kust.monsterfamiljer = { gastar: [], ododa: [] };
stripped.biomer.kust.egna_monster = [];
const strippedCat = buildBigWorldCatalog(stripped);
const kustChunk = generateChunkWorldData(5, 5, -10, -7, strippedCat);
assert.equal(kustChunk.spawnSubtypes.length, 0);
const stripScan = validateVarldStorSpawnScan(stripped, ctx, {
  seeds: [5],
  radius: 20,
  maxRing: 7,
  knownEmptyMellanmark: new Set<string>(),
});
assert.ok(
  stripScan.some((i) => i.includes('mellanmark') && i.includes('kust')),
  stripScan.join('\n'),
);

assert.equal(filterKnownVarldStorIssues(validateData().filter((i) => i.startsWith('varld_stor'))).length, 0);

console.log('big-world-review-fixes.test.mts: ok');
