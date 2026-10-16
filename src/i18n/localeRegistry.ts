import type { Dictionary } from './types';

const localesDir = new URL('./locales/', import.meta.url);

function viteDictModules(): Record<string, () => Promise<{ default: Dictionary }>> {
  try {
    return import.meta.glob('./locales/*.json') as Record<string, () => Promise<{ default: Dictionary }>>;
  } catch {
    return {};
  }
}

function viteOverlayModules(): Record<string, () => Promise<{ default: unknown }>> {
  try {
    return import.meta.glob('../data/i18n/*/*.json') as Record<string, () => Promise<{ default: unknown }>>;
  } catch {
    return {};
  }
}

const dictModules = viteDictModules();
export const overlayModules = viteOverlayModules();

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
