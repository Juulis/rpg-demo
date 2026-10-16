import type { DataLocalizer, DataOverlay } from './DataLocalizer';
import { isLocale } from './types';

/**
 * Laddar alla overlays i src/data/i18n/<locale>/*.json via Vite (import.meta.glob, eager).
 * Utanför Vite (t.ex. headless-test) finns ingen glob; då registreras inget och svenska används.
 */
export class DataOverlayLoader {
  constructor(private readonly target: DataLocalizer) {}

  loadBundled(): number {
    let modules: Record<string, unknown>;
    try {
      modules = import.meta.glob('../data/i18n/*/*.json', { eager: true, import: 'default' });
    } catch {
      return 0;
    }
    return this.load(modules);
  }

  /** path → JSON, där path innehåller .../<locale>/<fil>.json */
  load(modules: Readonly<Record<string, unknown>>): number {
    let n = 0;
    for (const [path, json] of Object.entries(modules)) {
      const m = /\/([a-z]{2})\/([^/]+)\.json$/.exec(path);
      // filer som börjar med _ (t.ex. _glossary.json) är hjälpfiler för översättare, inte overlays
      if (!m || !isLocale(m[1]) || m[2]?.startsWith('_') || typeof json !== 'object' || json === null) continue;
      this.target.addOverlay(m[1], m[2] ?? '', json as DataOverlay);
      n++;
    }
    return n;
  }
}
