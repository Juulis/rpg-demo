import routinesEn from '../data/i18n/en/routines.json';
import { getNpcLocale, type NpcLocale } from './npcText';

const EN = routinesEn as {
  night_default: string;
  night: Record<string, string>;
  activities: Record<string, string>;
};

export function routineActivityLabel(aktivitet: string, locale: NpcLocale = getNpcLocale()): string {
  if (!aktivitet) return '';
  if (locale === 'en') return EN.activities[aktivitet] ?? aktivitet;
  return aktivitet;
}

export function merchantNightGreeting(npcId: string, locale: NpcLocale = getNpcLocale()): string {
  if (locale === 'en') return EN.night[npcId] ?? EN.night_default;
  const sv: Record<string, string> = {
    tor_kolare: 'Tor snarkar i tältet — men guld väcker vem som helst.',
    hedda_jagare: 'Hedda har ett öga öppet. Hon handlar ändå.',
    marta_torghandlare: 'Märta mumlar från ståndet — affärer sover aldrig länge.',
    gunnar_jarnhand: 'Gunnar grymtar men öppnar vapenkistan.',
    sara_benlasare: 'Sara tänder ett ljus till. Ben och byteshandel lika.',
  };
  return sv[npcId] ?? 'Handlaren vaknar och gnuggar ögonen. Du kan handla om du har guld.';
}
