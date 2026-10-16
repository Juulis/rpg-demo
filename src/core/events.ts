/**
 * STUB – ersätts av Utvecklares core/events.ts. Överenskommen lista: ett namn per event, inga alias.
 * Events utan payload har typen undefined (emit('portal_open', undefined)).
 */
export type Quality = 'normal' | 'magic' | 'rare' | 'set' | 'legendary' | 'unique' | (string & {});

export type GameEvents = {
  hit: { target: string; dmg: number; crit: boolean };
  kill: { id: string; area: string; lvl: number; champion: boolean; unique: boolean; boss: boolean };
  loot_drop: { quality: Quality };
  pickup: { itemId: string; first: boolean };
  gold: { amount: number };
  rune: { n: number };
  portal_open: undefined;
  zone_enter: { name: string };
  boss_phase: undefined;
  boss_start: undefined;
  step: undefined;
  new_game: { seed: number };
  hero_loaded: { heroId: string };
  hero_deleted: { heroId: string };
  lore_unlock: { id: string };
  map_toggle: { open: boolean };
  level_up: { level: number };
  ui_open: { panel: string };
  ui_close: { panel: string };
};

export type GameEventName = keyof GameEvents;
