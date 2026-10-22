import rumorEn from '../data/i18n/en/rykten.json';
import type { RumorDef } from '../data/rumorTypes';
import type { NpcLocale } from '../npc/npcText';
import type { Text, TextKey } from '../text/Text';
import type { WorldState } from '../world/worldStateTypes';

const EN = rumorEn as Record<string, { text?: string }>;

let locale: NpcLocale = 'sv';

export function setRumorLocale(next: NpcLocale): void {
  locale = next;
}

function lastLegendaryItemId(world: Readonly<WorldState>): string | null {
  for (let i = world.last_events.length - 1; i >= 0; i--) {
    const e = world.last_events[i];
    if (!e?.id.startsWith('legendary_found')) continue;
    const parts = e.id.split(':');
    if (parts[1]) return parts[1];
  }
  if (world.legendaries_found.length) return world.legendaries_found[world.legendaries_found.length - 1] ?? null;
  return null;
}

function itemDisplayName(text: Text, itemId: string): string {
  const key = `items.${itemId}.name` as TextKey;
  const t = text.t(key);
  return t === key ? itemId.replaceAll('_', ' ') : t;
}

export interface RumorFormatInput {
  heroName: string;
  text: Text;
  world: Readonly<WorldState>;
}

export function formatRumorText(def: RumorDef, input: RumorFormatInput): string {
  const sv = def.text;
  const base = locale === 'en' ? (EN[def.id]?.text ?? sv) : sv;
  const bosses = input.world.bosses_killed.length;
  const itemId = lastLegendaryItemId(input.world);
  const foremal = itemId ? itemDisplayName(input.text, itemId) : input.text.t('rumor.unknown_item');
  return base.replaceAll('{hjalte}', input.heroName).replaceAll('{antal_bossar}', String(bosses)).replaceAll('{foremal}', foremal);
}
