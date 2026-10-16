import type { LocaleManager } from './LocaleManager';
import { DEFAULT_LOCALE, type Key, type Locale, type Params } from './types';

/**
 * Text i data (föremål, monster, lore, dialoger, quests). Tre former:
 * - "ren sträng"        → svenska, oöversatt (fallback)
 * - { sv, en? }         → fält per post
 * - { key, params? }    → nyckel i sv.json/en.json
 */
export type LocalizedText = string | ({ sv: string } & Partial<Record<Exclude<Locale, 'sv'>, string>>) | { key: Key; params?: Params };

/** Löser LocalizedText till aktivt språk med fallback till svenska. */
export class LocalizedTextResolver {
  constructor(private readonly i18n: LocaleManager) {}

  resolve(text: LocalizedText | null | undefined, params?: Params): string {
    if (text == null) return '';
    if (typeof text === 'string') return text;
    if ('key' in text) {
      const keyed = text as { key: Key; params?: Params };
      return this.i18n.t(keyed.key, { ...(keyed.params ?? {}), ...(params ?? {}) });
    }
    const loc = this.i18n.locale;
    const v = loc === DEFAULT_LOCALE ? text.sv : (text as Record<string, string>)[loc];
    if (v === undefined) this.i18n.missing(`lt:${loc}:${text.sv}`, `[i18n] Saknar ${loc}-text för "${text.sv}", använder svenska`);
    return v ?? text.sv;
  }
}
