import dialogEn from '../../spel/design/i18n/en/dialoger.json';
import type { DialogTyp } from '../data/dialogTypes';
import type { NpcLocale } from './npcText';
import type { Text } from '../text/Text';

type EnDialogNpc = { repliker?: Record<string, { text?: string }> };
const EN = dialogEn as Record<string, EnDialogNpc>;

let locale: NpcLocale = 'sv';

export function setDialogLocale(next: NpcLocale): void {
  locale = next;
}

export function dialogLineText(npcId: string, typ: DialogTyp, lineId: string, sv: string, text: Text): string {
  if (locale === 'en') {
    const en = EN[npcId]?.repliker?.[lineId]?.text;
    if (en) return en;
    return text.data('dialoger', `${npcId}.${typ}.${lineId}`, 'text', sv);
  }
  return sv;
}
