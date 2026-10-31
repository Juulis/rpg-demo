import assert from 'node:assert/strict';
import { DATA, validateData } from '../src/data';
import { validateVarldStor, filterKnownVarldStorDataDebt } from '../src/data/validateVarldStor';
import { generateChunkWorldData } from '../src/world/bigWorld/worldGenerator';
import { ChunkWorldCache } from '../src/world/bigWorld/chunkCache';

const ctx = {
  monsterIds: new Set(DATA.families.monsters.map((m) => m.id)),
  monsterById: new Map(DATA.families.monsters.map((m) => [m.id, m])),
  familyIds: new Set(DATA.families.families.map((f) => f.id)),
};

/** Känd platshållare tills design #107 synkas till src (fjall_bergsulvar / gruvspindel). */
function filterKnownVarldStorIssues(issues: string[]): string[] {
  return filterKnownVarldStorDataDebt(issues);
}

assert.ok(
  validateVarldStor(DATA.varldStor, ctx).some((i) => i.includes('egna_monster fjall_bergsulvar')),
  'validateVarldStor ska flagga fel familj på platshållaren fjall_bergsulvar',
);
assert.equal(filterKnownVarldStorIssues(validateVarldStor(DATA.varldStor, ctx)).length, 0);

const seed = 5;
const scanR = 16;
const emptyByRing = new Map<number, number>();
for (let cx = -scanR; cx <= scanR; cx++) {
  for (let cy = -scanR; cy <= scanR; cy++) {
    const d = generateChunkWorldData(seed, cx, cy);
    if (!d.mellanmark || d.safe) continue;
    if (d.spawnSubtypes.length === 0) {
      emptyByRing.set(d.ring, (emptyByRing.get(d.ring) ?? 0) + 1);
    }
  }
}
assert.equal(emptyByRing.size, 0, `tom mellanmark: ${[...emptyByRing.entries()]}`);

assert.throws(() => new ChunkWorldCache({ maxEntries: 48, keepRadius: 3 }));
const cache = new ChunkWorldCache({ maxEntries: 49, keepRadius: 3 });
const objs = new Set<object>();
for (let i = 0; i < 5; i++) {
  cache.syncNear(1, i * 10, 0);
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      objs.add(cache.get(1, i * 10 + dx, dy));
    }
  }
}
assert.equal(objs.size, 5 * 49, 'syncNear ska inte återanvända chunkobjekt inom keep');

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
assert.ok(
  slotIssues.some((i) => i.includes('egna_monster fjall_gruvkryp') && i.includes('tillhör')),
  slotIssues.join('\n'),
);

assert.equal(filterKnownVarldStorIssues(validateData().filter((i) => i.startsWith('varld_stor'))).length, 0);

console.log('big-world-review-fixes.test.mts: ok');
