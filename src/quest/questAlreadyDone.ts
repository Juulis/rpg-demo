import type { QuestDef } from '../data/questTypes';
import type { TriggerEnv } from './triggerMatch';
import { canonicalBossId } from '../world/bossIds';

/** Första steg-id efter redan_gjort-regler (designbeskrivningar kodade per quest). */
export function initialStepId(quest: QuestDef, env: TriggerEnv): string {
  const first = quest.steg[0]?.id ?? '';
  const boss = (id: string) => {
    const c = canonicalBossId(id) ?? id;
    return env.ctx.world.bosses_killed.includes(c) || env.ctx.world.bosses_killed.includes(id);
  };
  switch (quest.id) {
    case 'miras_bror':
      if (env.hasItem('flyktingens_sandaler')) return 'tillbaka';
      break;
    case 'benens_visk':
      if (env.hasItem('viskarens_skalle')) return 'atervand';
      break;
    case 'ulvhilds_pals':
      if (boss('grabjornen_ulvhild')) return 'palsen';
      break;
    case 'runornas_ristare':
      if (env.hasItem('ristarens_mejsel')) return 'markena';
      if (env.ctx.world.flags.krypta_besokt) return 'markena';
      break;
    case 'gravvaktarnas_sista_strid':
      if (env.hasItem('quest_gravvaktarnas_kronika')) return 'valet';
      break;
    case 'begrav_benkungen':
      if (boss('benkungen_valdemar')) return 'signeten';
      break;
    default:
      break;
  }
  return first;
}
