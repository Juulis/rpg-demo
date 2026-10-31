import type { Vec2 } from '../../core/GameContext';
import type { MonsterFactory } from '../../entities/MonsterFactory';
import { FOREST_SPAWN_ACTIVE_RADIUS } from '../forestConstants';
import type { World } from '../../systems/World';
import type { SpawnSpec } from '../../systems/SpawnSystem';
import type { ChunkWorldCache } from './chunkCache';
import { chunkSpawnToWorld, parseBigWorldSpawnUid, worldToChunk, chunkWorldSpan } from './bigWorldCoords';

function bwSpec(uid: string, enemy: string, level: number, elite: SpawnSpec['elite'] = null): SpawnSpec {
  return {
    uid,
    enemy,
    pos: [0, 0],
    level,
    elite,
    modifiers: [],
    boss: false,
  };
}

let lastHeroChunkCx = NaN;
let lastHeroChunkCy = NaN;
const liveUids = new Set<string>();
const nearChunksBuf: { cx: number; cy: number }[] = [];

function fillNearChunks(wx: number, wy: number, r: number): { cx: number; cy: number }[] {
  nearChunksBuf.length = 0;
  const span = chunkWorldSpan();
  const minCx = Math.floor((wx - r) / span);
  const maxCx = Math.floor((wx + r) / span);
  const minCy = Math.floor((wy - r) / span);
  const maxCy = Math.floor((wy + r) / span);
  for (let cx = minCx; cx <= maxCx; cx++) {
    for (let cy = minCy; cy <= maxCy; cy++) nearChunksBuf.push({ cx, cy });
  }
  return nearChunksBuf;
}

function refreshLiveUids(w: World): Set<string> {
  liveUids.clear();
  for (const m of w.monsters) {
    if (m.uid) liveUids.add(m.uid);
  }
  return liveUids;
}

function despawnFar(w: World, hero: Vec2, r: number): void {
  for (let i = w.monsters.length - 1; i >= 0; i--) {
    const mon = w.monsters[i];
    if (!mon) continue;
    if (Math.hypot(mon.pos.x - hero.x, mon.pos.y - hero.y) <= r) continue;
    mon.view.destroy({ children: true });
    w.objects.removeChild(mon.view);
    w.monsters.splice(i, 1);
  }
}

/** Instansierar/avlässnar chunk-monster; tung sync bara vid chunkbyte. */
export function syncBigWorldChunkMonsters(
  w: World,
  cache: ChunkWorldCache,
  factory: MonsterFactory,
  worldSeed: number,
  gameSeed: number,
  hero: Vec2,
): void {
  if (!w.zone.bigWorldStreaming) return;

  const { cx, cy } = worldToChunk(hero.x, hero.y);
  const chunkChanged = cx !== lastHeroChunkCx || cy !== lastHeroChunkCy;
  if (!chunkChanged) return;

  lastHeroChunkCx = cx;
  lastHeroChunkCy = cy;
  cache.syncNear(worldSeed, gameSeed, cx, cy);

  for (let i = w.monsters.length - 1; i >= 0; i--) {
    const mon = w.monsters[i];
    if (!mon?.uid) continue;
    if (!parseBigWorldSpawnUid(mon.uid)) {
      mon.view.destroy({ children: true });
      w.objects.removeChild(mon.view);
      w.monsters.splice(i, 1);
    }
  }

  const despawnR = FOREST_SPAWN_ACTIVE_RADIUS + 8;
  despawnFar(w, hero, despawnR);

  const live = refreshLiveUids(w);
  const spawnR = FOREST_SPAWN_ACTIVE_RADIUS;

  for (const { cx: ccx, cy: ccy } of fillNearChunks(hero.x, hero.y, spawnR)) {
    const data = cache.get(worldSeed, gameSeed, ccx, ccy);
    if (data.safe) continue;
    if (data.spawns.length === 0) continue;
    for (const s of data.spawns) {
      if (w.session.killed.has(s.uid)) continue;
      if (live.has(s.uid)) continue;
      const pos = chunkSpawnToWorld(ccx, ccy, s.localX, s.localY);
      if (Math.hypot(pos.x - hero.x, pos.y - hero.y) > spawnR) continue;
      w.zone.collide(pos, 0.5);
      factory.create(w, s.enemy, pos, s.level, bwSpec(s.uid, s.enemy, s.level, s.elite ?? null));
      live.add(s.uid);
    }
  }
}

export function resetBigWorldMonsterSync(): void {
  lastHeroChunkCx = NaN;
  lastHeroChunkCy = NaN;
  liveUids.clear();
}
