import type { QuestTrigger } from '../data/questTypes';
import type { ConditionContext } from '../world/evaluateCondition';
import { canonicalBossId } from '../world/bossIds';
import { inTimeWindow } from './questTime';
import type { QuestProgress } from '../data/questTypes';

export interface TriggerEnv {
  ctx: ConditionContext;
  worldTime: number;
  hasItem: (id: string) => boolean;
  talkNpc?: string;
  pickupItem?: string;
  bossId?: string;
  region?: string;
  ankare?: string;
  inspectAnkare?: string;
}

function bossKilled(ctx: ConditionContext, boss: string): boolean {
  const id = canonicalBossId(boss) ?? boss;
  return ctx.world.bosses_killed.includes(id) || ctx.world.bosses_killed.includes(boss);
}

function matchOne(trigger: QuestTrigger, env: TriggerEnv, progress?: QuestProgress): boolean {
  const t = trigger.typ;
  if (t === 'prata_med') return env.talkNpc === trigger.npc;
  if (t === 'prata_med_en_av') {
    const list = Array.isArray(trigger.npc) ? trigger.npc : trigger.npc ? [trigger.npc] : [];
    return env.talkNpc ? list.includes(env.talkNpc) : false;
  }
  if (t === 'plocka_upp') {
    if (env.pickupItem) return env.pickupItem === trigger.item;
    return trigger.item ? env.hasItem(trigger.item) : false;
  }
  if (t === 'boss_killed') return trigger.boss ? bossKilled(env.ctx, trigger.boss) : false;
  if (t === 'gå_in_i') {
    if (trigger.region && env.region !== trigger.region) return false;
    if (trigger.ankare && env.ankare !== trigger.ankare) return false;
    return !!env.region;
  }
  if (t === 'inspektera') {
    if (trigger.region && env.region && env.region !== trigger.region) return false;
    const want = trigger.ankare;
    if (typeof want === 'string') return env.inspectAnkare === want;
    return false;
  }
  if (t === 'inspektera_alla') {
    const list = Array.isArray(trigger.ankare) ? trigger.ankare : [];
    const done = new Set(progress?.inspekterat ?? []);
    if (env.inspectAnkare) done.add(env.inspectAnkare);
    return list.length > 0 && list.every((a) => done.has(a));
  }
  if (t === 'någon_av' && trigger.val) {
    return trigger.val.some((sub) => matchOne(sub, env, progress));
  }
  if (trigger.tid?.length === 2) {
    if (!inTimeWindow(env.worldTime, trigger.tid[0], trigger.tid[1])) return false;
  }
  return t === 'någon_av' ? false : t === 'inspektera' && !trigger.ankare;
}

export function triggerSatisfied(trigger: QuestTrigger, env: TriggerEnv, progress?: QuestProgress): boolean {
  if (trigger.tid?.length === 2 && !inTimeWindow(env.worldTime, trigger.tid[0], trigger.tid[1])) return false;
  if (trigger.typ === 'någon_av' && trigger.val) return trigger.val.some((sub) => matchOne(sub, env, progress));
  return matchOne(trigger, env, progress);
}

export function startTriggerSatisfied(start: QuestTrigger, env: TriggerEnv): boolean {
  return triggerSatisfied(start, env);
}
