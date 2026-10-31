import type { Vec2 } from '../../core/GameContext';
import type { MonsterFactory } from '../../entities/MonsterFactory';
import { FOREST_SPAWN_ACTIVE_RADIUS } from '../forestConstants';
import type { World } from '../../systems/World';
import type { SpawnSpec } from '../../systems/SpawnSystem';
import { syncProximitySpawns } from '../../systems/SpawnProximity';
import { chunksNearWorld } from './bigWorldPortals';
import type { ChunkWorldCache } from './chunkCache';
import { chunkSpawnToWorld, parseBigWorldSpawnUid, worldToChunk } from './bigWorldCoords';

function bwSpec(uid: string, enemy: string, level: number): SpawnSpec {
  return {
    uid,
    enemy,
    pos: [0, 0],
    level,
    elite: null,
    modifiers: [],
    boss: false,
  };
}

let lastHeroChunkCx = NaN;
let lastHeroChunkCy = NaN;

function monsterUids(w: World): Set<string> {
  const s = new Set<string>();
  for (const m of w.monsters) {
    if (m.uid) s.add(m.uid);
  }
  return s;
}

/** Instansierar/avlägsnar chunk-monster nära hjälten; tung avsync bara vid chunkbyte. */
export function syncBigWorldChunkMonsters(
  w: World,
  cache: ChunkWorldCache,
  factory: MonsterFactory,
  worldSeed: number,
  gameSeed: number,
  hero: Vec2,
): void {
  if (!w.zone.bigWorldStreaming) return;
  syncProximitySpawns(w, factory, hero);

  const { cx, cy } = worldToChunk(hero.x, hero.y);
  const chunkChanged = cx !== lastHeroChunkCx || cy !== lastHeroChunkCy;
  if (chunkChanged) {
    lastHeroChunkCx = cx;
    lastHeroChunkCy = cy;
    cache.syncNear(worldSeed, gameSeed, cx, cy);
    const r = FOREST_SPAWN_ACTIVE_RADIUS + 8;
    for (let i = w.monsters.length - 1; i >= 0; i--) {
      const mon = w.monsters[i];
      if (!mon?.uid) continue;
      const loc = parseBigWorldSpawnUid(mon.uid);
      if (!loc) continue;
      if (Math.hypot(mon.pos.x - hero.x, mon.pos.y - hero.y) <= r) continue;
      mon.view.destroy({ children: true });
      w.objects.removeChild(mon.view);
      w.monsters.splice(i, 1);
    }
  }

  const live = monsterUids(w);
  const spawnR = FOREST_SPAWN_ACTIVE_RADIUS;
  for (const { cx: ccx, cy: ccy } of chunksNearWorld(hero.x, hero.y, spawnR)) {
    const data = cache.get(worldSeed, gameSeed, ccx, ccy);
    if (data.safe || !data.generatedSpawn) continue;
    for (const s of data.spawns) {
      if (w.session.killed.has(s.uid)) continue;
      if (live.has(s.uid)) continue;
      const pos = chunkSpawnToWorld(ccx, ccy, s.localX, s.localY);
      if (Math.hypot(pos.x - hero.x, pos.y - hero.y) > spawnR) continue;
      w.zone.collide(pos, 0.5);
      factory.create(w, s.enemy, pos, s.level, bwSpec(s.uid, s.enemy, s.level));
      live.add(s.uid);
    }
  }
}

/** Nollställ chunk-spårning (t.ex. vid zonbyte). */
export function resetBigWorldMonsterSync(): void {
  lastHeroChunkCx = NaN;
  lastHeroChunkCy = NaN;
}
