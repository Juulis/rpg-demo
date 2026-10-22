import { isRecord } from '../core/json';
import type { WorldState } from './worldStateTypes';

/** Stadstillstånd i stigande ordning (för city_state_gte). */
export const CITY_STATE_ORDER = [
  'besatt',
  'rensad',
  'aterbefolkad_1',
  'aterbefolkad_2',
  'aterbefolkad_3',
] as const;

export interface ConditionContext {
  world: Readonly<WorldState>;
  /** Speldygn (för rykten/pending); 0 om okänt. */
  day?: number;
}

function cityRank(state: string): number {
  const i = CITY_STATE_ORDER.indexOf(state as (typeof CITY_STATE_ORDER)[number]);
  return i >= 0 ? i : 0;
}

function readOne(cond: Record<string, unknown>, ctx: ConditionContext): boolean {
  if ('boss_killed' in cond) return ctx.world.bosses_killed.includes(String(cond.boss_killed));
  if ('boss_not_killed' in cond) return !ctx.world.bosses_killed.includes(String(cond.boss_not_killed));
  if ('bosses_killed_gte' in cond) {
    const n = Number(cond.bosses_killed_gte);
    return ctx.world.bosses_killed.length >= n;
  }
  if ('runes_active_gte' in cond) return ctx.world.runes_active >= Number(cond.runes_active_gte);
  if ('runes_active_lt' in cond) return ctx.world.runes_active < Number(cond.runes_active_lt);
  if ('city_state_gte' in cond && isRecord(cond.city_state_gte)) {
    const city = String(cond.city_state_gte.city ?? 'gamla_byn');
    const min = String(cond.city_state_gte.min ?? cond.city_state_gte.state ?? 'besatt');
    const cur = ctx.world.city_states[city] ?? 'besatt';
    return cityRank(cur) >= cityRank(min);
  }
  if ('event' in cond) {
    const id = String(cond.event);
    return ctx.world.last_events.some((e) => e.id === id || e.id.endsWith(`:${id}`) || e.id.includes(id));
  }
  if ('npc_state' in cond && isRecord(cond.npc_state)) {
    const npc = String(cond.npc_state.id);
    const want = String(cond.npc_state.state);
    return (ctx.world.npc_states[npc] ?? '') === want;
  }
  if ('quest_status' in cond && isRecord(cond.quest_status)) {
    const q = String(cond.quest_status.id);
    const want = String(cond.quest_status.status);
    const cur = ctx.world.quests[q];
    if (want === 'not_started') return cur === undefined;
    if (!isRecord(cur)) return false;
    return String(cur.status ?? '') === want;
  }
  if ('quest_val' in cond && isRecord(cond.quest_val)) {
    const q = String(cond.quest_val.id);
    const key = String(cond.quest_val.key ?? 'choice');
    const want = cond.quest_val.value;
    const cur = ctx.world.quests[q];
    if (!isRecord(cur)) return false;
    return cur[key] === want;
  }
  if ('rykte_aktivt' in cond) {
    const id = String(cond.rykte_aktivt);
    const r = ctx.world.rumors_active[id];
    if (!r) return false;
    const day = ctx.day ?? 0;
    if (r.until_day !== undefined && day > r.until_day) return false;
    return true;
  }
  if ('faction_rep_gte' in cond && isRecord(cond.faction_rep_gte)) {
    const f = String(cond.faction_rep_gte.faction ?? cond.faction_rep_gte.id);
    const n = Number(cond.faction_rep_gte.value ?? cond.faction_rep_gte.min);
    return (ctx.world.faction_rep[f] ?? 0) >= n;
  }
  if ('faction_rep_lt' in cond && isRecord(cond.faction_rep_lt)) {
    const f = String(cond.faction_rep_lt.faction ?? cond.faction_rep_lt.id);
    const n = Number(cond.faction_rep_lt.value ?? cond.faction_rep_lt.max);
    return (ctx.world.faction_rep[f] ?? 0) < n;
  }
  if ('flag' in cond) return !!ctx.world.flags[String(cond.flag)];
  return false;
}

/** Utvärderar ett villkor (objekt, array = och, eller { and, or }). */
export function evaluateCondition(cond: unknown, ctx: ConditionContext): boolean {
  if (cond === null || cond === undefined || cond === true) return true;
  if (cond === false) return false;
  if (Array.isArray(cond)) return cond.every((c) => evaluateCondition(c, ctx));
  if (!isRecord(cond)) return false;
  if (Array.isArray(cond.and)) return cond.and.every((c) => evaluateCondition(c, ctx));
  if (Array.isArray(cond.or)) return cond.or.some((c) => evaluateCondition(c, ctx));
  const keys = Object.keys(cond);
  if (keys.length === 1) return readOne(cond, ctx);
  return keys.every((k) => {
    if (k === 'and' || k === 'or') return true;
    return readOne({ [k]: cond[k] }, ctx);
  });
}
