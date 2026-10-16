/* eslint-disable @typescript-eslint/no-invalid-void-type -- void = event utan payload (godkänt kontrakt) */
/**
 * Alla spelhändelser med payload (godkänt kontrakt mellan Utvecklare 1 och 2).
 * EN namnform per händelse – inga alias (t.ex. inget death/rune_activate). Nya events läggs till här.
 */
export type UiPanel = 'inventory' | 'map' | 'lore' | 'menu' | 'settings';

// `type` (inte interface) så att den uppfyller Record<string, unknown> i EventBus.
export type GameEvents = {
  hit: { target: string; dmg: number; crit: boolean };
  kill: { id: string; area: string; lvl: number; champion: boolean; unique: boolean; boss: boolean };
  loot_drop: { quality: string };
  pickup: { itemId: string; first: boolean };
  gold: { amount: number };
  rune: { n: number };
  portal_open: void;
  zone_enter: { name: string };
  boss_start: void;
  boss_phase: { phase: number };
  step: void;
  level_up: { level: number };
  new_game: { seed: number };
  hero_loaded: { heroId: string };
  hero_deleted: { heroId: string };
  lore_unlock: { id: string };
  map_toggle: { open: boolean };
  ui_open: { panel: UiPanel };
  ui_close: { panel: UiPanel };
};
