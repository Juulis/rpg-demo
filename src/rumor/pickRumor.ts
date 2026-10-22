import type { RumorDef } from '../data/rumorTypes';
import { allRumors } from './rumorCatalog';
import { evaluateCondition, type ConditionContext } from '../world/evaluateCondition';

function rumorMatches(def: RumorDef, ctx: ConditionContext): boolean {
  return evaluateCondition(def.villkor ?? true, ctx);
}

/** Aktiva rykten för en NPC (villkor + talare, utan ersatta). */
export function eligibleRumorsForNpc(npcId: string, ctx: ConditionContext): RumorDef[] {
  const activeIds = new Set<string>();
  const matched: RumorDef[] = [];
  for (const r of allRumors()) {
    if (!r.talare.includes(npcId)) continue;
    if (!rumorMatches(r, ctx)) continue;
    matched.push(r);
    activeIds.add(r.id);
  }
  const replaced = new Set<string>();
  for (const r of matched) {
    if (r.ersatter) replaced.add(r.ersatter);
  }
  return matched.filter((r) => !replaced.has(r.id)).sort((a, b) => b.prioritet - a.prioritet);
}

/** Högst prioriterade ryktet NPC:n inte sagt senast; annars högst prioriterade. */
export function pickRumorForNpc(npcId: string, ctx: ConditionContext, lastSpokenId: string | undefined): RumorDef | null {
  const pool = eligibleRumorsForNpc(npcId, ctx);
  if (!pool.length) return null;
  const fresh = pool.find((r) => r.id !== lastSpokenId);
  return fresh ?? pool[0] ?? null;
}

/** Gnista när högst prioriterade aktiva ryktet inte är det NPC:n senast berättade. */
export function npcHasNewRumor(npcId: string, ctx: ConditionContext, lastSpokenId: string | undefined): boolean {
  const pool = eligibleRumorsForNpc(npcId, ctx);
  if (!pool.length) return false;
  if (!lastSpokenId) return true;
  const top = pool[0];
  return top ? top.id !== lastSpokenId : false;
}
