import type { LocaleManager } from './LocaleManager';
import { DEFAULT_LOCALE, type Locale } from './types';

type Exists = (url: string) => Promise<boolean>;

const headExists: Exists = (url) =>
  fetch(url, { method: 'HEAD' }).then(
    (r) => r.ok,
    () => false,
  );

/**
 * Röstfiler för NPC-repliker: <BASE_URL>assets/audio/npc/<locale>/<npc>/<replik-id>.ogg (public/assets/audio/npc/...).
 * Saknas filen för aktivt språk används sv. Resultat cachas per URL.
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
    return `${this.base}assets/audio/npc/${locale}/${npc}/${lineId}.ogg`;
  }

  /** URL för aktivt språk om filen finns, annars svenska. */
  async resolve(npc: string, lineId: string): Promise<string> {
    const loc = this.i18n.locale;
    const sv = this.url(DEFAULT_LOCALE, npc, lineId);
    if (loc === DEFAULT_LOCALE) return sv;
    const want = this.url(loc, npc, lineId);
    if (await this.check(want)) return want;
    this.i18n.missing(`voice:${want}`, `[i18n] Röstfil saknas: ${want}, använder svenska`);
    return sv;
  }

  private check(url: string): Promise<boolean> {
    let p = this.cache.get(url);
    if (!p) this.cache.set(url, (p = this.exists(url)));
    return p;
  }
}
