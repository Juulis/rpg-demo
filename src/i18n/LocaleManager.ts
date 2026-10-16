import type { EventBus } from '../core/EventBus';
import type { GameContext, GameModule } from '../core/GameContext';
import { LocalStore, type KeyValueStore } from '../core/storage';
import en from './en.json';
import { i18nBus, type I18nEvents } from './events.ext';
import sv from './sv.json';
import { Translator } from './Translator';
import { DEFAULT_LOCALE, isLocale, type Dictionary, type Key, type Locale, type Params } from './types';

export interface LocaleManagerOptions {
  store?: KeyValueStore;
  dicts?: Readonly<Record<Locale, Dictionary>>;
  /** Varna för saknade nycklar (standard: import.meta.env.DEV). */
  dev?: boolean;
  warn?: (msg: string) => void;
}

/**
 * Aktivt språk + översättning. Skapas i main.ts och skickas via konstruktorn till moduler som visar text;
 * registreras själv som GameModule för att få bussen. Valet sparas i localStorage ('rpg_locale').
 * Saknas en nyckel på engelska används svenska (varning i dev-läge).
 */
export class LocaleManager implements GameModule {
  static readonly STORAGE_KEY = 'rpg_locale';
  private current: Locale;
  private bus: EventBus<I18nEvents> | null = null;
  private readonly store: KeyValueStore;
  private readonly translator: Translator;
  private readonly dev: boolean;
  private readonly warn: (msg: string) => void;
  private readonly warned = new Set<string>();
  private readonly listeners = new Set<(l: Locale) => void>();

  constructor(opts: LocaleManagerOptions = {}) {
    this.store = opts.store ?? new LocalStore();
    this.translator = new Translator(opts.dicts ?? { sv: sv as Dictionary, en: en as Dictionary });
    this.dev = opts.dev ?? LocaleManager.isDev();
    this.warn = opts.warn ?? ((m) => console.warn(m));
    const saved = this.store.get(LocaleManager.STORAGE_KEY);
    this.current = isLocale(saved) ? saved : DEFAULT_LOCALE;
  }

  private static isDev(): boolean {
    try {
      return import.meta.env.DEV === true;
    } catch {
      return false;
    }
  }

  init(ctx: GameContext): void {
    this.bus = i18nBus(ctx.bus);
  }

  get locale(): Locale {
    return this.current;
  }

  setLocale(locale: Locale): void {
    if (locale === this.current) return;
    this.current = locale;
    this.store.set(LocaleManager.STORAGE_KEY, locale);
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
    for (const fn of this.listeners) fn(locale);
    this.bus?.emit('locale_changed', { locale });
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
