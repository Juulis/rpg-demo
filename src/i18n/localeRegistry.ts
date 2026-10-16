import type { Dictionary } from './types';

const localesDir = new URL('./locales/', import.meta.url);

const dictModules: Record<string, () => Promise<{ default: Dictionary }>> =
  typeof import.meta.glob === 'function'
    ? (import.meta.glob('./locales/*.json') as Record<string, () => Promise<{ default: Dictionary }>>)
    : {};

export const overlayModules: Record<string, () => Promise<{ default: unknown }>> =
  typeof import.meta.glob === 'function'
    ? (import.meta.glob('../data/i18n/*/*.json') as Record<string, () => Promise<{ default: unknown }>>)
    : {};

function idsFromGlob(mods: Record<string, unknown>, re: RegExp): string[] {
  return Object.keys(mods)
    .map((p) => re.exec(p)?.[1])
    .filter((id): id is string => !!id && !id.startsWith('_'))
    .sort();
}

/** Registrerade språk-id (Vite-glob i build; fast lista i Node utan glob). */
export const REGISTERED_LOCALES: readonly string[] =
  Object.keys(dictModules).length > 0 ? idsFromGlob(dictModules, /\/([^/]+)\.json$/) : ['sv', 'en'];

export async function loadDictionary(locale: string): Promise<Dictionary> {
  const entry = Object.entries(dictModules).find(([p]) => p.endsWith(`/${locale}.json`));
  if (entry) return (await entry[1]()).default;
  const { readFileSync } = await import('node:fs');
  const raw = readFileSync(new URL(`${locale}.json`, localesDir), 'utf8');
  return JSON.parse(raw) as Dictionary;
}
