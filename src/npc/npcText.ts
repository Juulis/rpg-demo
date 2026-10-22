import npcEn from '../data/i18n/en/npc.json';
import type { NpcDef } from '../data/npcTypes';
import type { Text } from '../text/Text';

export type NpcLocale = 'sv' | 'en';

let locale: NpcLocale = 'sv';

export function setNpcLocale(next: NpcLocale): void {
  locale = next;
}

export function getNpcLocale(): NpcLocale {
  return locale;
}

const EN = npcEn as Record<string, Partial<Record<'name' | 'default_line', string>>>;

export function npcName(text: Text, def: NpcDef): string {
  const sv = def.name;
  if (locale === 'en') return EN[def.id]?.name ?? text.data('npc', def.id, 'name', sv);
  return sv;
}

export function npcLine(text: Text, def: NpcDef, line?: string): string {
  const sv = line ?? def.default_line;
  if (locale === 'en') return EN[def.id]?.default_line ?? text.data('npc', def.id, 'default_line', sv);
  return sv;
}
