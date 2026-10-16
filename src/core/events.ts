import type { EliteKind } from '../data/types';

/** Alla spelhändelser med payload. Lägg till nya här så att emit/on typkontrolleras. */
export interface GameEvents {
  hit: { monsterUid: string; monsterId: string; damage: number; crit: boolean; strong: boolean };
  miss: { monsterUid: string };
  kill: { uid: string; monsterId: string; area: string; level: number; elite: EliteKind | null; boss: boolean };
  hero_hurt: { damage: number; blocked: boolean };
  hero_death: Record<string, never>;
  loot_drop: { quality: string; base?: string; gold?: number };
  pickup: { itemId: string; first: boolean };
  gold: { amount: number; total: number };
  bag_full: Record<string, never>;
  rune: { activated: number; total: number };
  portal_open: Record<string, never>;
  portal_sealed: { message: string };
  zone_enter: { zone: string; area: string };
  boss_start: { uid: string; monsterId: string };
  boss_phase: { phase: number; name: string };
  step: Record<string, never>;
  level_up: { level: number };
  xp: { xp: number; level: number };
  equip: { slot: string; itemId: string | null };
  new_game: { seed: number };
  lore_unlock: { id: string };
  save: { reason: string };
}
