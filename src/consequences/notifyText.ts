import type { NpcLocale } from '../npc/npcText';
import notifyEn from '../data/i18n/en/consequences.json';

let locale: NpcLocale = 'sv';

export function setConsequenceNotifyLocale(next: NpcLocale): void {
  locale = next;
}

const SV: Record<string, string> = {
  'consequence.faction_up': 'Fraktionsrykte ökat ({faction}).',
  'consequence.faction_down': 'Fraktionsrykte minskat ({faction}).',
  'consequence.item': 'Du fick: {item}.',
  'consequence.item_bag_full': 'Väskan är full — {item} väntar.',
  'consequence.xp': '+{amount} erfarenhet.',
  'consequence.rumor': 'Ett nytt rykte sprids…',
  'consequence.town': '{town} förändras.',
  'consequence.npc_state': '{npc} förändras.',
  'consequence.quest_path': 'En questväg stängs.',
  'consequence.greeting_warm': 'De välkomnar dig varmt.',
  'consequence.greeting_cold': 'De hälsar kallt.',
};

export function consequenceNotifyText(key: string, params: Record<string, string | number> = {}): string {
  const raw = locale === 'en' ? ((notifyEn as Record<string, string>)[key] ?? SV[key] ?? key) : (SV[key] ?? key);
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}
