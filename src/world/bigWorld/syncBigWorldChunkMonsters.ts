import type { Vec2 } from '../../core/GameContext';
import type { MonsterFactory } from '../../entities/MonsterFactory';
import type { World } from '../../systems/World';
import type { SpawnSpec } from '../../systems/SpawnSystem';
import { BIG_WORLD_CACHE_KEEP_RADIUS } from './bigWorldConfig';
import { chunkSpawnToWorld, parseBigWorldSpawnUid, worldToChunk } from './bigWorldCoords';
import type { ChunkWorldCache } from './chunkCache';

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

/** Instansierar/avlägsnar chunk-monster inom ChunkWorldCache keep-fönstret. */
export function syncBigWorldChunkMonsters(w: World, cache: ChunkWorldCache, factory: MonsterFactory, gameSeed: number, hero: Vec2): void {
  if (!w.zone.bigWorldStreaming) return;
  const { cx, cy } = worldToChunk(hero.x, hero.y);
  cache.syncNear(gameSeed, cx, cy);
  const r = BIG_WORLD_CACHE_KEEP_RADIUS;
  const activeChunks = new Set<string>();
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      const ccx = cx + dx;
      const ccy = cy + dy;
      activeChunks.add(`${ccx},${ccy}`);
      const data = cache.get(gameSeed, ccx, ccy);
      if (data.safe || !data.generatedSpawn) continue;
      for (const s of data.spawns) {
        if (w.session.killed.has(s.uid)) continue;
        if (w.monsters.some((m) => m.uid === s.uid)) continue;
        const pos = chunkSpawnToWorld(ccx, ccy, s.localX, s.localY);
        w.zone.collide(pos, 0.5);
        factory.create(w, s.enemy, pos, s.level, bwSpec(s.uid, s.enemy, s.level));
      }
    }
  }
  for (let i = w.monsters.length - 1; i >= 0; i--) {
    const mon = w.monsters[i];
    if (!mon?.uid) continue;
    const loc = parseBigWorldSpawnUid(mon.uid);
    if (!loc) continue;
    if (activeChunks.has(`${loc.cx},${loc.cy}`)) continue;
    mon.view.destroy();
    w.objects.removeChild(mon.view);
    w.monsters.splice(i, 1);
  }
}
