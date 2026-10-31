import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { validateVarldStorSpawnScan, mellanmarkEmptyCoverage } from '../src/data/validateVarldStorSpawnScan';
import { buildBigWorldCatalog, generateChunkWorldData } from '../src/world/bigWorld/worldGenerator';
import { chunkDistanceFromStart, ringAtChunkDistance } from '../src/world/bigWorld/ringZone';
import { mellanmarkLevelBand } from '../src/world/bigWorld/spawnRules';
import { KNOWN_EMPTY_MELLANMARK, mellanmarkEmptyIssues } from '../src/world/bigWorld/knownEmptyMellanmark';

const ctx = {
  monsterIds: new Set(DATA.families.monsters.map((m) => m.id)),
  monsterById: new Map(DATA.families.monsters.map((m) => [m.id, m])),
  familyIds: new Set(DATA.families.families.map((f) => f.id)),
};

const scanOpts = { seeds: [1, 5, 42, 12345], radius: 40, maxRing: 7 };

const bandIssues = validateVarldStorSpawnScan(DATA.varldStor, ctx, { ...scanOpts, checkKnownEmpty: false });
assert.equal(bandIssues.length, 0, bandIssues.slice(0, 20).join('\n'));

const emptyCoverage = mellanmarkEmptyCoverage(DATA.varldStor, scanOpts);
const emptyIssues = mellanmarkEmptyIssues(emptyCoverage, KNOWN_EMPTY_MELLANMARK);
assert.equal(emptyIssues.length, 0, emptyIssues.join('\n'));

const fullEmpty = [...emptyCoverage.entries()]
  .filter(([, s]) => s.total > 0 && s.empty === s.total)
  .map(([k]) => k)
  .sort();
const known = [...KNOWN_EMPTY_MELLANMARK].sort();
assert.deepEqual(fullEmpty, known, 'KNOWN_EMPTY_MELLANMARK ska matcha alla helt tomma ring|biom');

const scanAll = validateVarldStorSpawnScan(DATA.varldStor, ctx, scanOpts);
assert.equal(scanAll.length, 0, scanAll.join('\n'));

let bandMismatchChunks = 0;
let spawnLevelOutside = 0;
const catalog = buildBigWorldCatalog(DATA.varldStor);
const ringar = DATA.varldStor.meta.zonmodell?.ringar ?? [];
const start = DATA.varldStor.meta.startpunkt.chunk;

for (const seed of scanOpts.seeds) {
  for (let cx = -scanOpts.radius; cx <= scanOpts.radius; cx++) {
    for (let cy = -scanOpts.radius; cy <= scanOpts.radius; cy++) {
      const d = generateChunkWorldData(seed, cx, cy, catalog);
      if (d.ring > scanOpts.maxRing) continue;
      const dist = chunkDistanceFromStart(cx, cy, start);
      const chunkRing = ringAtChunkDistance(dist, ringar);
      const ringBand = mellanmarkLevelBand(DATA.varldStor, chunkRing.ring, chunkRing.levelBand);
      if (d.mellanmark && (d.levelBand[0] !== ringBand[0] || d.levelBand[1] !== ringBand[1])) {
        bandMismatchChunks++;
      }
      for (const s of d.spawns) {
        const band = d.mellanmark ? ringBand : d.levelBand;
        if (s.level < band[0] || s.level > band[1]) spawnLevelOutside++;
      }
    }
  }
}

assert.equal(bandMismatchChunks, 0, `mellanmark levelBand avviker från ringband: ${bandMismatchChunks} chunkar`);
assert.equal(spawnLevelOutside, 0, `spawn-nivå utanför band: ${spawnLevelOutside} träffar`);

console.log('big-world-ring-band.test.mts: ok');
