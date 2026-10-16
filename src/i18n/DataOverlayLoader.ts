import type { DataLocalizer, DataOverlay } from './DataLocalizer';
import { overlayModules } from './localeRegistry';
import { isLocale, type Locale } from './types';

/**
 * Laddar overlays i src/data/i18n/<locale>/*.json lazy per språk (dynamisk import).
 * Filer som _glossary.json ingår inte i glob-mönstret.
 */
export class DataOverlayLoader {
  private readonly loaded = new Set<Locale>();

  constructor(private readonly target: DataLocalizer) {}

  /** path → JSON, där path innehåller .../<locale>/<fil>.json (headless-test). */
  load(modules: Readonly<Record<string, unknown>>): number {
    let n = 0;
    for (const [path, json] of Object.entries(modules)) {
      const m = /\/([a-z]{2})\/([^/]+)\.json$/.exec(path);
      if (!m || !isLocale(m[1]) || m[2]?.startsWith('_') || typeof json !== 'object' || json === null) continue;
      this.target.addOverlay(m[1], m[2] ?? '', json as DataOverlay);
      n++;
    }
    return n;
  }

  async loadLocale(locale: Locale): Promise<number> {
    if (this.loaded.has(locale)) return 0;
    let n = 0;
    for (const [path, loader] of Object.entries(overlayModules)) {
      const m = /\/([a-z]{2})\/([^/]+)\.json$/.exec(path);
      if (!m || m[1] !== locale || m[2]?.startsWith('_')) continue;
      const mod = await loader();
      const json = mod.default;
      if (typeof json === 'object' && json !== null) {
        this.target.addOverlay(locale, m[2] ?? '', json as DataOverlay);
        n++;
      }
    }
    this.loaded.add(locale);
    return n;
  }
}
