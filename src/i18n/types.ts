import type sv from './sv.json';

export const LOCALES = ['sv', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'sv';
export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/** Pluralform i språkfilen: { "one": "...", "other": "..." } (fler CLDR-former tillåtna). */
export interface PluralForms {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

type IsPlural<T> = T extends { other: string } ? true : false;
/** Alla punktseparerade nycklar i sv.json vars värde är en sträng eller en pluralform. */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : IsPlural<T[K]> extends true ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Typad översättningsnyckel, härledd från sv.json (svenska är källan). */
export type Key = Leaves<typeof sv>;

export type Params = Readonly<Record<string, string | number>>;

/** Rekursivt ordboksträd (en.json kan sakna nycklar: då används svenska). */
export interface Dictionary {
  [k: string]: string | PluralForms | Dictionary;
}
