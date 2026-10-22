import type { QuestChoice, QuestDef } from '../data/questTypes';
import { act1Quests, questById } from './questCatalog';
import { initialStepId } from './questAlreadyDone';
import { applyConsequences, type ConsequenceRuntime } from './consequenceRunner';
import { readQuestProgress, writeQuestProgress } from './questProgress';
import { gameDay } from './questTime';
import { startTriggerSatisfied, triggerSatisfied } from './triggerMatch';
import type { TriggerEnv } from './triggerMatch';
import { inTimeWindow } from './questTime';
import { repopulationCityAfterQuest } from '../world/repopulation';
import type { WorldStateService } from '../world/WorldStateService';
import type { WorldState } from '../world/worldStateTypes';

export interface QuestEngineHooks {
  hasItem: (id: string) => boolean;
  worldTime: number;
  region: string;
}

export class QuestEngine {
  constructor(private readonly worldState: WorldStateService) {}

  private ws(): WorldState {
    return this.worldState.get() as WorldState;
  }

  private env(hooks: QuestEngineHooks, partial: Partial<TriggerEnv> = {}): TriggerEnv {
    const day = gameDay(hooks.worldTime);
    return {
      ctx: { world: this.ws(), day },
      worldTime: hooks.worldTime,
      hasItem: hooks.hasItem,
      region: hooks.region,
      ...partial,
    };
  }

  private excluded(questId: string): boolean {
    return this.ws().quest_excludes.some((x) => x === questId || x.startsWith(`${questId}:`));
  }

  private stepIndex(def: QuestDef, stepId: string): number {
    return def.steg.findIndex((s) => s.id === stepId);
  }

  private currentStep(def: QuestDef, progress: ReturnType<typeof readQuestProgress>) {
    const id = progress.steg ?? def.steg[0]?.id;
    return def.steg.find((s) => s.id === id) ?? def.steg[0];
  }

  private advance(def: QuestDef, hooks: QuestEngineHooks, partial: Partial<TriggerEnv>): boolean {
    const progress = readQuestProgress(this.ws(), def.id);
    if (progress.status !== 'aktiv' || !progress.steg) return false;
    const step = this.currentStep(def, progress);
    if (!step) return false;
    const env = this.env(hooks, partial);
    if (!triggerSatisfied(step.trigger, env, progress)) return false;
    const idx = this.stepIndex(def, step.id);
    const next = def.steg[idx + 1];
    if (!next) {
      if (def.val?.length) return true;
      writeQuestProgress(this.ws(), def.id, { ...progress, status: 'klar' });
      return true;
    }
    writeQuestProgress(this.ws(), def.id, { ...progress, steg: next.id });
    return true;
  }

  tryStart(def: QuestDef, hooks: QuestEngineHooks, giverNpc: string): boolean {
    if (this.excluded(def.id)) return false;
    const progress = readQuestProgress(this.ws(), def.id);
    if (progress.status !== 'ej_startad') return false;
    const env = this.env(hooks, { talkNpc: giverNpc });
    if (!startTriggerSatisfied(def.start, env)) return false;
    const steg = initialStepId(def, env);
    writeQuestProgress(this.ws(), def.id, { status: 'aktiv', steg, givare: giverNpc });
    this.fastForward(def, hooks);
    return true;
  }

  /** Hoppa fram över redan uppfyllda steg. */
  fastForward(def: QuestDef, hooks: QuestEngineHooks): void {
    const progress = readQuestProgress(this.ws(), def.id);
    if (progress.status !== 'aktiv' || !progress.steg) return;
    let guard = 0;
    while (guard++ < def.steg.length + 2) {
      const step = this.currentStep(def, progress);
      if (!step) break;
      const env = this.env(hooks, {});
      if (!triggerSatisfied(step.trigger, env, progress)) break;
      const idx = this.stepIndex(def, step.id);
      const next = def.steg[idx + 1];
      if (!next) break;
      writeQuestProgress(this.ws(), def.id, { ...progress, steg: next.id });
      progress.steg = next.id;
    }
  }

  onNpcTalk(npcId: string, hooks: QuestEngineHooks): void {
    for (const def of act1Quests()) {
      if (def.givare === npcId || def.alternativ_givare === npcId) this.tryStart(def, hooks, npcId);
    }
    for (const def of act1Quests()) {
      this.advance(def, hooks, { talkNpc: npcId });
    }
  }

  onPickup(itemId: string, hooks: QuestEngineHooks): void {
    for (const def of act1Quests()) {
      this.advance(def, hooks, { pickupItem: itemId });
    }
  }

  onBossKilled(bossId: string, hooks: QuestEngineHooks): void {
    for (const def of act1Quests()) {
      const env = this.env(hooks, { bossId });
      if (def.start.typ === 'någon_av' && startTriggerSatisfied(def.start, env)) {
        this.tryStart(def, hooks, def.givare);
      }
      this.advance(def, hooks, { bossId });
    }
  }

  onEnterRegion(region: string, ankare: string | undefined, hooks: QuestEngineHooks): void {
    const h = { ...hooks, region };
    for (const def of act1Quests()) {
      this.advance(def, h, { region, ankare });
    }
  }

  onInspect(ankare: string, hooks: QuestEngineHooks): void {
    for (const def of act1Quests()) {
      const progress = readQuestProgress(this.ws(), def.id);
      if (progress.status !== 'aktiv') continue;
      const step = this.currentStep(def, progress);
      if (!step) continue;
      const tr = step.trigger;
      if (tr.typ === 'inspektera_alla') {
        const list = Array.isArray(tr.ankare) ? tr.ankare : [];
        if (!list.includes(ankare)) continue;
      } else if (tr.typ === 'inspektera') {
        if (typeof tr.ankare === 'string' && tr.ankare !== ankare) continue;
      } else {
        continue;
      }
      if (tr.tid?.length === 2 && !inTimeWindow(hooks.worldTime, tr.tid[0], tr.tid[1])) continue;
      const ins = [...(progress.inspekterat ?? [])];
      if (!ins.includes(ankare)) ins.push(ankare);
      writeQuestProgress(this.ws(), def.id, { ...progress, inspekterat: ins });
      this.advance(def, hooks, { inspectAnkare: ankare, ankare });
    }
  }

  /** Val som ska visas när spelaren pratar med NPC på val-steg. */
  pendingChoices(npcId: string, hooks: QuestEngineHooks): { quest: QuestDef; choices: QuestChoice[] }[] {
    const out: { quest: QuestDef; choices: QuestChoice[] }[] = [];
    for (const def of act1Quests()) {
      const progress = readQuestProgress(this.ws(), def.id);
      if (progress.status !== 'aktiv' || !def.val?.length) continue;
      const step = this.currentStep(def, progress);
      if (!step) continue;
      const env = this.env(hooks, { talkNpc: npcId });
      const onChoiceStep =
        step.trigger.typ === 'prata_med'
          ? step.trigger.npc === npcId
          : step.trigger.typ === 'prata_med_en_av' && Array.isArray(step.trigger.npc)
            ? step.trigger.npc.includes(npcId)
            : false;
      if (!onChoiceStep) continue;
      if (!triggerSatisfied(step.trigger, env, progress)) continue;
      out.push({ quest: def, choices: def.val });
    }
    return out;
  }

  applyChoice(questId: string, choiceId: string, hooks: QuestEngineHooks, runtime: ConsequenceRuntime = {}): boolean {
    const def = questById(questId);
    if (!def) return false;
    const choice = def.val?.find((c) => c.id === choiceId);
    if (!choice) return false;
    const progress = readQuestProgress(this.ws(), def.id);
    if (progress.status !== 'aktiv') return false;
    const day = gameDay(hooks.worldTime);
    if (choice.consequences?.length) applyConsequences(this.worldState, choice.consequences, day, runtime);
    const xp = def.belöning?.xp;
    if (typeof xp === 'number' && xp > 0) {
      applyConsequences(this.worldState, [{ typ: 'xp_grant', amount: xp }], day, runtime);
    }
    writeQuestProgress(this.ws(), def.id, { status: 'klar', val: choiceId, steg: progress.steg, givare: progress.givare });
    const bump = repopulationCityAfterQuest(this.ws(), def.id);
    if (bump) this.worldState.setCityState(bump.city, bump.state);
    return true;
  }

  activeAndCompleted(): { active: QuestDef[]; done: QuestDef[] } {
    const active: QuestDef[] = [];
    const done: QuestDef[] = [];
    for (const def of act1Quests()) {
      const p = readQuestProgress(this.ws(), def.id);
      if (p.status === 'aktiv') active.push(def);
      if (p.status === 'klar') done.push(def);
    }
    return { active, done };
  }
}
