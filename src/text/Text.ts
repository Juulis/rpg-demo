import { SV } from './sv';

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
/** Alla giltiga textnycklar (härleds från sv.ts, fel nyckel = kompileringsfel). */
export type TextKey = Leaves<typeof SV>;
export type TextParams = Record<string, string | number>;

/**
 * Enda vägen för motorn att hämta visningstext. Två källor:
 * - t(key): UI-texter (sv.ts nu, U2:s LocaleManager.t när #22 är mergad – samma nycklar).
 * - data(file, id, field, sv): text ur speldata (föremålsnamn, monsternamn …), motsvarar DataLocalizer.field.
 * Byt källa med setProvider() utan att röra anroparna; lyssna på bus 'locale_changed' för omritning.
 */
export interface TextProvider {
  t(key: string, params?: TextParams): string | undefined;
  data?(file: string, id: string, field: string, sv: string): string;
}

export class Text {
  private provider: TextProvider | null = null;

  setProvider(p: TextProvider | null): void {
    this.provider = p;
  }

  t(key: TextKey, params: TextParams = {}): string {
    const s = this.provider?.t(key, params) ?? Text.lookup(key);
    return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
  }

  data(file: string, id: string, field: string, sv: string): string {
    return this.provider?.data?.(file, id, field, sv) ?? sv;
  }

  private static lookup(key: string): string {
    let cur: unknown = SV;
    for (const part of key.split('.')) cur = (cur as Record<string, unknown> | undefined)?.[part];
    return typeof cur === 'string' ? cur : key;
  }
}
