import type { LocaleManager } from './LocaleManager';
import { DEFAULT_LOCALE, type Locale } from './types';

type Exists = (url: string) => Promise<boolean>;

const headExists: Exists = (url) =>
  fetch(url, { method: 'HEAD' }).then(
    (r) => r.ok,
    () => false,
  );

/**
 * Röstfiler för NPC-repliker under public/assets/audio/npc/:
 * sv: <BASE_URL>assets/audio/npc/<npc>/<replik-id>.ogg
 * en: <BASE_URL>assets/audio/npc/en/<npc>/<replik-id>.ogg
 * Returnerar null om ingen fil finns. Resultat cachas per URL.
 */
export class VoiceResolver {
  private readonly cache = new Map<string, Promise<boolean>>();

  constructor(
    private readonly i18n: LocaleManager,
    private readonly exists: Exists = headExists,
    private readonly base: string = VoiceResolver.baseUrl(),
  ) {}

  static baseUrl(): string {
    try {
      return import.meta.env.BASE_URL || '/';
    } catch {
      return '/';
    }
  }

  url(locale: Locale, npc: string, lineId: string): string {
    const prefix = locale === DEFAULT_LOCALE ? '' : `${locale}/`;
    return `${this.base}assets/audio/npc/${prefix}${npc}/${lineId}.ogg`;
  }

  /** URL om en fil finns för aktivt språk (eller sv-fallback), annars null. */
  async resolve(npc: string, lineId: string): Promise<string | null> {
    const loc = this.i18n.locale;
    const sv = this.url(DEFAULT_LOCALE, npc, lineId);
    if (loc === DEFAULT_LOCALE) return (await this.check(sv)) ? sv : null;
    const want = this.url(loc, npc, lineId);
    if (await this.check(want)) return want;
    if (await this.check(sv)) {
      this.i18n.missing(`voice:${want}`, `[i18n] Röstfil saknas: ${want}, använder svenska`);
      return sv;
    }
    return null;
  }

  private check(url: string): Promise<boolean> {
    let p = this.cache.get(url);
    if (!p) this.cache.set(url, (p = this.exists(url)));
    return p;
  }
}
