import type { Dictionary, Key, Locale, Params, PluralForms } from './types';

const isPlural = (v: unknown): v is PluralForms => typeof v === 'object' && v !== null && typeof (v as PluralForms).other === 'string';

/** Ren uppslagning: nyckel → text för ett språk, interpolation {param} och pluralisering via Intl.PluralRules (param `count`). */
export class Translator {
  private readonly dicts: Partial<Record<Locale, Dictionary>> = {};
  private readonly plural = new Map<Locale, Intl.PluralRules>();

  setDictionary(locale: Locale, dict: Dictionary): void {
    this.dicts[locale] = dict;
  }

  /** Rå post (sträng/pluralform) eller undefined om nyckeln saknas i språket. */
  lookup(locale: Locale, key: string): string | PluralForms | undefined {
    let cur: string | PluralForms | Dictionary | undefined = this.dicts[locale];
    for (const part of key.split('.')) {
      if (cur === undefined || typeof cur === 'string' || isPlural(cur)) return undefined;
      cur = cur[part];
    }
    return typeof cur === 'string' || isPlural(cur) ? cur : undefined;
  }

  format(locale: Locale, entry: string | PluralForms, params: Params = {}): string {
    let s: string;
    if (typeof entry === 'string') s = entry;
    else {
      const n = Number(params.count ?? 0);
      const form = this.rules(locale).select(n) as keyof PluralForms;
      s = entry[form] ?? entry.other;
    }
    return Translator.interpolate(s, params);
  }

  static interpolate(s: string, params: Params): string {
    return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
  }

  has(locale: Locale, key: Key): boolean {
    return this.lookup(locale, key) !== undefined;
  }

  private rules(locale: Locale): Intl.PluralRules {
    let r = this.plural.get(locale);
    if (!r) this.plural.set(locale, (r = new Intl.PluralRules(locale)));
    return r;
  }
}
