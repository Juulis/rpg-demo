import portalBy from '../data/portal_by.json';
import { CITY_STATE_ORDER } from './evaluateCondition';
import type { WorldState } from './worldStateTypes';
import { readQuestProgress } from '../quest/questProgress';

const REPOP = portalBy.repopulation as {
  city_id?: string;
  unique_quest_lvl3?: string;
} | undefined;

/** Nivå 3 i Den gamla byn kräver stadens unika uppdrag (portal_by §6). */
export function uniqueRepopulationQuestId(cityId: string): string | null {
  if (!REPOP || REPOP.city_id !== cityId) return null;
  const q = REPOP.unique_quest_lvl3;
  return typeof q === 'string' ? q : null;
}

export function repopulationCityAfterQuest(
  ws: WorldState,
  questId: string,
): { city: string; state: string } | null {
  const city = REPOP?.city_id ?? 'gamla_byn';
  const unique = uniqueRepopulationQuestId(city);
  if (!unique || questId !== unique) return null;
  const progress = readQuestProgress(ws, questId);
  if (progress.status !== 'klar') return null;
  const cur = ws.city_states[city] ?? 'besatt';
  const target = 'aterbefolkad_3';
  if (cur === target) return null;
  const need = 'aterbefolkad_2';
  if (cur !== need) return null;
  return { city, state: target };
}

export function cityStateRank(state: string): number {
  const i = CITY_STATE_ORDER.indexOf(state as (typeof CITY_STATE_ORDER)[number]);
  return i >= 0 ? i : 0;
}
