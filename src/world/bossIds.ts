import { DATA } from '../data';

let cache: Set<string> | null = null;

export function bossMonsterIds(): Set<string> {
  if (!cache) {
    cache = new Set();
    for (const m of DATA.families.monsters) if (m.boss) cache.add(m.id);
    for (const f of DATA.families.families) if (f.boss) cache.add(f.boss);
  }
  return cache;
}

export function isBossMonsterId(id: string): boolean {
  if (bossMonsterIds().has(id)) return true;
  for (const bid of bossMonsterIds()) if (id.startsWith(`${bid}_`) || id.startsWith(bid)) return true;
  return false;
}

export function canonicalBossId(id: string): string | null {
  if (bossMonsterIds().has(id)) return id;
  for (const bid of bossMonsterIds()) if (id === bid || id.startsWith(`${bid}_`)) return bid;
  return null;
}
