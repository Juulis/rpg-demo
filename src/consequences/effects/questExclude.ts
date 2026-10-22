import type { EffectModule } from '../types';

export const questExclude: EffectModule = (eff, { ws, notifyKey }) => {
  if (typeof eff.quest !== 'string') return;
  const tag = eff.val ? `${eff.quest}:${eff.val}` : eff.quest;
  if (!ws.quest_excludes.includes(tag)) ws.quest_excludes.push(tag);
  notifyKey('consequence.quest_path');
};
