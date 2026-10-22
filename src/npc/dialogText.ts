import dialogEn from '../data/i18n/en/dialoger.json';
import type { DialogTyp } from '../data/dialogTypes';
import type { NpcLocale } from './npcText';
import type { Text } from '../text/Text';

const EN = dialogEn as Record<string, Partial<Record<DialogTyp, Record<string, string>>>>;

let locale: NpcLocale = 'sv';

export function setDialogLocale(next: NpcLocale): void {
  locale = next;
}

export function dialogLineText(npcId: string, typ: DialogTyp, lineId: string, sv: string, text: Text): string {
  if (locale === 'en') {
    const en = EN[npcId]?.[typ]?.[lineId];
    if (en) return en;
    return text.data('dialoger', `${npcId}.${typ}.${lineId}`, 'text', sv);
  }
  return sv;
}
