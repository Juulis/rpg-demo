import type { EventBus } from '../core/EventBus';
import type { SaveBackend } from '../core/SaveBackend';
import type { GameContext, GameModule } from '../core/GameContext';
import { DataLocalizer } from './DataLocalizer';
import { DataOverlayLoader } from './DataOverlayLoader';
import { loadDictionary } from './localeRegistry';
import { Translator } from './Translator';
import type { Text } from '../text/Text';
import { DEFAULT_LOCALE, isLocale, type Dictionary, type Key, type Locale, type Params } from './types';

export interface LocaleManagerOptions {
  dicts?: Readonly<Partial<Record<Locale, Dictionary>>>;
  /** Varna för saknade nycklar (standard: import.meta.env.DEV). */
  dev?: boolean;
  warn?: (msg: string) => void;
}

/**
 * Aktivt språk + översättning. Språkval sparas via SaveBackend.getSetting/setSetting ('rpg_locale').
 * Ordböcker och data-overlays laddas lazy per språk.
 */
export class LocaleManager implements GameModule {
  static readonly STORAGE_KEY = 'rpg_locale';
  private current: Locale = DEFAULT_LOCALE;
  private bus: EventBus<import('../core/events').GameEvents> | null = null;
  private settings: SaveBackend | null = null;
  readonly data: DataLocalizer;
  private readonly translator = new Translator();
  private readonly overlayLoader: DataOverlayLoader;
  private readonly loadedDicts = new Set<Locale>();
  private readonly dev: boolean;
  private readonly warn: (msg: string) => void;
  private readonly warned = new Set<string>();
  private readonly listeners = new Set<(l: Locale) => void>();
  private readonly seedDicts: Readonly<Partial<Record<Locale, Dictionary>>>;

  constructor(opts: LocaleManagerOptions = {}) {
    this.dev = opts.dev ?? LocaleManager.isDev();
    this.warn = opts.warn ?? ((m) => console.warn(m));
    this.seedDicts = opts.dicts ?? {};
    this.data = new DataLocalizer(this);
    this.overlayLoader = new DataOverlayLoader(this.data);
    const seedSv = this.seedDicts[DEFAULT_LOCALE];
    if (seedSv) {
      this.translator.setDictionary(DEFAULT_LOCALE, seedSv);
      this.loadedDicts.add(DEFAULT_LOCALE);
    }
  }

  private static isDev(): boolean {
    try {
      return import.meta.env.DEV === true;
    } catch {
      return false;
    }
  }

  /** Läser sparat språk och laddar ordbok/overlays (anropas från SaveModule.ready). */
  async bindSettings(backend: SaveBackend): Promise<void> {
    this.settings = backend;
    await this.ensureLocaleData(DEFAULT_LOCALE);
    const saved = await backend.getSetting(LocaleManager.STORAGE_KEY);
    const loc = isLocale(saved) ? saved : DEFAULT_LOCALE;
    if (loc !== DEFAULT_LOCALE) await this.ensureLocaleData(loc);
    this.current = loc;
    if (typeof document !== 'undefined') document.documentElement.lang = loc;
    this.bus?.emit('locale_changed', { locale: loc as 'en' | 'sv' });
  }

  /** Kopplar motorn Text till LocaleManager + DataLocalizer (anropas från main.ts före Game.start). */
  attachText(text: Text): void {
    text.setProvider({
      t: (key, params) => this.t(key as Key, params),
      data: (file, id, field, svValue) => this.data.field(file, id, field, svValue),
    });
  }

  init(ctx: GameContext): void {
    this.bus = ctx.bus;
  }

  get locale(): Locale {
    return this.current;
  }

  async setLocale(locale: Locale): Promise<void> {
    if (locale === this.current) return;
    await this.ensureLocaleData(locale);
    this.current = locale;
    if (this.settings) await this.settings.setSetting(LocaleManager.STORAGE_KEY, locale);
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
    for (const fn of this.listeners) fn(locale);
    this.bus?.emit('locale_changed', { locale: locale as 'en' | 'sv' });
  }

  private async ensureLocaleData(locale: Locale): Promise<void> {
    if (!this.loadedDicts.has(locale)) {
      const dict = this.seedDicts[locale] ?? (await loadDictionary(locale));
      this.translator.setDictionary(locale, dict);
      this.loadedDicts.add(locale);
    }
    if (locale !== DEFAULT_LOCALE) await this.overlayLoader.loadLocale(locale);
  }

  /** Lokal prenumeration för klasser utan buss (t.ex. vyer). Returnerar avregistrering. */
  onChange(fn: (l: Locale) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Översätt. Pluralisering: ange params.count för nycklar med {one, other}. */
  t(key: Key, params?: Params): string {
    const tr = this.translator;
    const entry = tr.lookup(this.current, key);
    if (entry !== undefined) return tr.format(this.current, entry, params);
    const fallback = tr.lookup(DEFAULT_LOCALE, key);
    this.missing(`${this.current}:${key}`, `[i18n] Saknar "${key}" för ${this.current}, använder svenska`);
    return fallback !== undefined ? tr.format(DEFAULT_LOCALE, fallback, params) : key;
  }

  /** Varnar en gång per nyckel i dev-läge. Används även av DataLocalizer/VoiceResolver. */
  missing(id: string, msg: string): void {
    if (!this.dev || this.warned.has(id)) return;
    this.warned.add(id);
    this.warn(msg);
  }

  dispose(): void {
    this.bus = null;
    this.listeners.clear();
  }
}
