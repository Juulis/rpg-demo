import setEn from './i18n/en/set.json';
import setSv from './i18n/sv/set.json';
import type { Text } from '../text/Text';

export type SetLocale = 'sv' | 'en';

let locale: SetLocale = 'sv';

const EN = setEn as Record<string, SetLocaleBlock>;
const SV = setSv as Record<string, SetLocaleBlock>;

type SetLocaleBlock = {
  name?: string;
  theme?: string;
  pieces?: Record<string, { name?: string }>;
  bonuses?: Record<string, Record<string, string> | string>;
};

export function setSetLocale(next: SetLocale): void {
  locale = next;
}

function block(id: string): SetLocaleBlock | undefined {
  return locale === 'en' ? EN[id] : SV[id];
}

/** Setnamn eller delnamn (del-id är globalt unikt i set.json). */
export function setLocalizedName(id: string, svFallback: string): string {
  const direct = block(id)?.name;
  if (direct) return direct;
  for (const s of Object.values(locale === 'en' ? EN : SV)) {
    const p = s.pieces?.[id]?.name;
    if (p) return p;
  }
  return svFallback;
}

/** Text för en bonusrad (hel rad eller enskild nyckel). */
export function setBonusLocalized(setId: string, tier: string, bonusKey: string, svFallback: string): string {
  const b = block(setId)?.bonuses?.[tier];
  if (!b) return svFallback;
  if (typeof b === 'string') return b;
  return b[bonusKey] ?? svFallback;
}

export function setTextData(file: string, id: string, field: string, sv: string): string | undefined {
  if (file !== 'set') return undefined;
  if (field === 'name') return setLocalizedName(id, sv);
  return undefined;
}

/** Formaterar en setbonusnyckel till visningstext (tooltip / karaktärspanel). */
/** Alla bonusrader för en tröskel (2/3/4/5 delar), för tooltip. */
export function formatSetBonusTier(
  text: Text,
  setId: string,
  tier: string,
  bon: Record<string, unknown>,
  statLine: (k: string, v: number) => string | null,
): string {
  return Object.entries(bon)
    .map(([bk, bv]) => describeSetBonusKey(text, setId, tier, bk, bv, statLine))
    .filter(Boolean)
    .join(', ');
}

export function describeSetBonusKey(
  text: Text,
  setId: string,
  tier: string,
  bonusKey: string,
  value: unknown,
  statLine: (k: string, v: number) => string | null,
): string | null {
  if (typeof value === 'number') return statLine(bonusKey, value);

  const localized = setBonusLocalized(setId, tier, bonusKey, '');
  if (localized) return localized;

  if (bonusKey === 'skill_bonus' && value && typeof value === 'object') {
    return Object.entries(value as Record<string, Record<string, unknown>>)
      .map(([sk, mods]) => {
        const skName = text.data('klasser', sk, 'name', sk);
        const parts = Object.entries(mods)
          .map(([mk, mv]) => {
            if (typeof mv === 'number') {
              const inner = statLine(mk, mv);
              return inner ?? `${mk} ${mv}`;
            }
            if (mv === true) return mk.replace(/_/g, ' ');
            return null;
          })
          .filter(Boolean);
        return `${skName}: ${parts.join(', ')}`;
      })
      .join('; ');
  }

  if (bonusKey === 'immune_knockback' && value === true) {
    return text.t('set_bonus.immune_knockback');
  }

  if (bonusKey === 'magic_unlock_preview' && value && typeof value === 'object') {
    const note = (value as { note?: string }).note;
    return note ?? text.t('set_bonus.magic_unlock_preview');
  }

  if (typeof value === 'boolean' && value) return bonusKey.replace(/_/g, ' ');
  return null;
}
