import type { NpcLocale } from '../npc/npcText';
import hudEn from '../data/i18n/en/hud.json';

let locale: NpcLocale = 'sv';

export function setClockLocale(next: NpcLocale): void {
  locale = next;
}

const SV = {
  day: 'Dag',
  night: 'Natt',
};

export function clockPeriodLabel(isNight: boolean): string {
  const key = isNight ? 'night' : 'day';
  if (locale === 'en') {
    const en = hudEn as { day?: string; night?: string };
    return (isNight ? en.night : en.day) ?? SV[key];
  }
  return SV[key];
}
