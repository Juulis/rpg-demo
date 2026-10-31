import type { Vec2 } from '../../core/GameContext';
import type { SpawnSpec } from '../../systems/SpawnSystem';
import type { World } from '../../systems/World';
import { resolveRegionAtChunk } from './regionIndex';
import { chunkWorldSpan, worldToChunk } from './bigWorldCoords';
import { getBigWorldCatalog } from './worldGenerator';
import { isInsideStartskogenChunk } from './heroRegion';

/** Legacy startskog (spawnzoner) är centrerad på regionens mittchunk — inte världens origo. */
export function startskogenLegacyAnchor(): Vec2 {
  const region = getBigWorldCatalog().regionById.get('startskogen');
  if (!region) return { x: 0, y: 0 };
  const [cx, cy] = region.chunk;
  const span = chunkWorldSpan();
  return { x: cx * span + span * 0.5, y: cy * span + span * 0.5 };
}

export function offsetToStartskogenAnchor(local: Vec2): Vec2 {
  const a = startskogenLegacyAnchor();
  return { x: local.x + a.x, y: local.y + a.y };
}

/** Chunk får chunk-genererade monster om legacy-startskogen inte äger ytan. */
export function chunkMonsterSpawnsEnabled(cx: number, cy: number): boolean {
  if (isInsideStartskogenChunk(cx, cy)) return false;
  const { region, inside } = resolveRegionAtChunk(cx, cy, getBigWorldCatalog().data.regioner);
  if (inside && region.genererad_spawn !== true) return false;
  return true;
}

export function spawnPointInsideStartskogenFootprint(worldPos: Vec2): boolean {
  const { cx, cy } = worldToChunk(worldPos.x, worldPos.y);
  return isInsideStartskogenChunk(cx, cy);
}

export function mapStartskogenSpecsToQueue(w: World, specs: readonly SpawnSpec[]): World['spawnQueue'] {
  return specs
    .map((s) => {
      const local = w.zone.toWorld(s.pos);
      const p = offsetToStartskogenAnchor(local);
      w.zone.collide(p, 0.5);
      return { spec: s, pos: p, done: false };
    })
    .filter((q) => spawnPointInsideStartskogenFootprint(q.pos));
}

export function ensureStartskogenSpawnQueue(w: World, roll: () => SpawnSpec[]): void {
  if (!w.zone.bigWorldStreaming) return;
  if (w.spawnQueue.length > 0) return;
  w.spawnQueue = mapStartskogenSpecsToQueue(w, roll());
}

/** När legacy-monster despawnas (ej dödade) ska spawnkön kunna instansiera igen. */
export function releaseStartskogenQueueSlot(w: World, uid: string): void {
  if (!uid.startsWith('startskogen:')) return;
  if (w.session.killed.has(uid)) return;
  for (const q of w.spawnQueue) {
    if (q.spec.uid === uid) q.done = false;
  }
}

/** Offset för statiska skogsobjekt (runor, portal, entry) i stor värld. */
export function applyStartskogenAnchor(localX: number, localY: number): Vec2 {
  return offsetToStartskogenAnchor({ x: localX, y: localY });
}
