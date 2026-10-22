import type { FoundEntry } from '../core/SaveBackend';
import { isRecord } from '../core/json';
import type { GameRecord } from '../save/types';
import { bossMonsterIds, isBossMonsterId } from './bossIds';

export interface WorldStateLastEvent {
  id: string;
  at: number;
  /** Speldygn när händelsen inträffade (för t.ex. legendary_found). */
  day?: number;
}

export interface WorldStatePending {
  id: string;
  due_day: number;
  effect: Record<string, unknown>;
}

/** Per-hjälte världstillstånd (quests, rykten, städer, konsekvenser). */
export interface WorldState {
  bosses_killed: string[];
  city_states: Record<string, string>;
  runes_active: number;
  legendaries_found: string[];
  last_events: WorldStateLastEvent[];
  flags: Record<string, boolean>;
  values: Record<string, number>;
  faction_rep: Record<string, number>;
  npc_states: Record<string, string>;
  npc_locations: Record<string, string>;
  npc_factions: Record<string, string>;
  town_growth: Record<string, number>;
  merchant_mods: Record<string, number>;
  area_changes: Record<string, string>;
  quests: Record<string, unknown>;
  quest_excludes: string[];
  rumors_active: Record<string, { since_day?: number; until_day?: number }>;
  /** Senaste ryktes-id per NPC (prat). */
  rumors_last: Record<string, string>;
  pending: WorldStatePending[];
}

export function createEmptyWorldState(): WorldState {
  return {
    bosses_killed: [],
    city_states: {},
    runes_active: 0,
    legendaries_found: [],
    last_events: [],
    flags: {},
    values: {},
    faction_rep: {},
    npc_states: {},
    npc_locations: {},
    npc_factions: {},
    town_growth: {},
    merchant_mods: {},
    area_changes: {},
    quests: {},
    quest_excludes: [],
    rumors_active: {},
    rumors_last: {},
    pending: [],
  };
}

export function parseWorldState(raw: unknown): WorldState | null {
  if (!isRecord(raw)) return null;
  const ws = createEmptyWorldState();
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  ws.bosses_killed = arr(raw.bosses_killed);
  ws.legendaries_found = arr(raw.legendaries_found);
  ws.quest_excludes = arr(raw.quest_excludes);
  if (isRecord(raw.city_states)) {
    for (const [k, v] of Object.entries(raw.city_states)) if (typeof v === 'string') ws.city_states[k] = v;
  }
  if (typeof raw.runes_active === 'number' && Number.isFinite(raw.runes_active)) ws.runes_active = raw.runes_active;
  if (Array.isArray(raw.last_events)) {
    for (const e of raw.last_events) {
      if (isRecord(e) && typeof e.id === 'string' && typeof e.at === 'number') {
        ws.last_events.push({
          id: e.id,
          at: e.at,
          ...(typeof e.day === 'number' ? { day: e.day } : {}),
        });
      }
    }
  }
  const boolMap = (v: unknown, target: Record<string, boolean>): void => {
    if (!isRecord(v)) return;
    for (const [k, b] of Object.entries(v)) if (typeof b === 'boolean') target[k] = b;
  };
  const numMap = (v: unknown, target: Record<string, number>): void => {
    if (!isRecord(v)) return;
    for (const [k, n] of Object.entries(v)) if (typeof n === 'number' && Number.isFinite(n)) target[k] = n;
  };
  const strMap = (v: unknown, target: Record<string, string>): void => {
    if (!isRecord(v)) return;
    for (const [k, s] of Object.entries(v)) if (typeof s === 'string') target[k] = s;
  };
  boolMap(raw.flags, ws.flags);
  numMap(raw.values, ws.values);
  numMap(raw.faction_rep, ws.faction_rep);
  strMap(raw.npc_states, ws.npc_states);
  strMap(raw.npc_locations, ws.npc_locations);
  strMap(raw.npc_factions, ws.npc_factions);
  numMap(raw.town_growth, ws.town_growth);
  numMap(raw.merchant_mods, ws.merchant_mods);
  strMap(raw.area_changes, ws.area_changes);
  strMap(raw.rumors_last, ws.rumors_last);
  if (isRecord(raw.quests)) ws.quests = { ...raw.quests };
  if (isRecord(raw.rumors_active)) {
    for (const [k, v] of Object.entries(raw.rumors_active)) {
      if (!isRecord(v)) continue;
      ws.rumors_active[k] = {
        ...(typeof v.since_day === 'number' ? { since_day: v.since_day } : {}),
        ...(typeof v.until_day === 'number' ? { until_day: v.until_day } : {}),
      };
    }
  }
  if (Array.isArray(raw.pending)) {
    for (const p of raw.pending) {
      if (!isRecord(p) || typeof p.id !== 'string' || typeof p.due_day !== 'number') continue;
      ws.pending.push({
        id: p.id,
        due_day: p.due_day,
        effect: isRecord(p.effect) ? { ...p.effect } : {},
      });
    }
  }
  return ws;
}

/** Bygger world_state från äldre sparfiler (game + fynd). */
export function hydrateWorldStateFromLegacy(game: GameRecord | null, foundItems?: Record<string, FoundEntry>): WorldState {
  const ws = createEmptyWorldState();
  if (!game) return ws;
  ws.runes_active = game.runes;
  if (game.city) ws.city_states.gamla_byn = game.city;
  const bosses = new Set<string>();
  for (const id of game.killed) {
    if (isBossMonsterId(id)) bosses.add(id);
    else {
      for (const bid of bossMonsterIds()) {
        if (id.startsWith(bid)) bosses.add(bid);
      }
    }
  }
  ws.bosses_killed = [...bosses];
  if (foundItems) {
    for (const [itemId, e] of Object.entries(foundItems)) {
      if (e.quality === 'legendary') ws.legendaries_found.push(itemId);
    }
  }
  return ws;
}

export function cloneWorldState(s: WorldState): WorldState {
  return structuredClone(s);
}
