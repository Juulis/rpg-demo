import { Session } from '../core/Session';
import { Rng } from '../core/Rng';

/**
 * Lagring i localStorage, bakåtkompatibel med legacy js/save.js:
 *   rpg_heroes        [{id, name, cls, level, savedAt}]
 *   rpg_hero_<id>     {version, hero:{id,name,cls,level,xp,gold,inv,equip,fresh?}, game:{seed,killed[],zone,pos,rot,stage,runes,city}|null, found?, savedAt}
 *   rpg_save          {version, last}
 *   rpg_found         {<itemId>: {first, quality, base, ilvl}}  (lorebok)
 */
export const SAVE_VERSION = 1;
export const MAX_HEROES = 8;
const K_INDEX = 'rpg_heroes';
const K_LAST = 'rpg_save';
const K_FOUND = 'rpg_found';
const heroKey = (id: string): string => `rpg_hero_${id}`;

export interface HeroIndexEntry {
  id: string;
  name: string;
  cls: string;
  level: number;
  savedAt?: number;
}
export interface HeroData {
  id: string;
  name: string;
  cls: string;
  level: number;
  xp: number;
  gold: number;
  inv: unknown[];
  equip: Record<string, unknown>;
  fresh?: boolean;
}
export interface GameData {
  seed: number;
  killed: string[];
  zone: string;
  pos: [number, number] | null;
  rot?: number;
  stage: number;
  runes: number;
  city: string;
}
export interface SaveFile {
  version: number;
  hero: HeroData;
  game: GameData | null;
  found?: number;
  savedAt?: number;
}
export interface FoundEntry {
  first: string;
  quality?: string;
  base?: string;
  ilvl?: number;
}

/** Lagringsgränssnitt (localStorage i webbläsaren, Map i tester). */
export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export class SaveManager {
  constructor(private readonly store: KeyValueStore = localStorage) {}

  private read<T>(k: string): T | null {
    try {
      return JSON.parse(this.store.getItem(k) ?? 'null') as T | null;
    } catch {
      return null;
    }
  }

  private write(k: string, v: unknown): boolean {
    try {
      this.store.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      console.warn('Sparning misslyckades', e);
      return false;
    }
  }

  /** v0 (platt objekt) → v1. Returnerar null för okänt/nyare format. */
  static migrate(raw: unknown): SaveFile | null {
    if (!raw || typeof raw !== 'object') return null;
    let d = raw as Record<string, unknown> & Partial<SaveFile>;
    if (!d.version) {
      const o = d as Record<string, unknown>;
      d = {
        version: 1,
        hero: {
          id: String(o.id ?? ''),
          name: String(o.name ?? ''),
          cls: String(o.cls ?? 'riddare'),
          level: Number(o.level ?? 1),
          xp: Number(o.xp ?? 0),
          gold: Number(o.gold ?? 0),
          inv: (o.inv as unknown[]) ?? [],
          equip: (o.equip as Record<string, unknown>) ?? {},
        },
        game: o.seed
          ? {
              seed: Number(o.seed),
              killed: (o.killed as string[]) ?? [],
              zone: String(o.zone ?? 'forest'),
              pos: (o.pos as [number, number]) ?? null,
              stage: Number(o.stage ?? 0),
              runes: Number(o.runes ?? 0),
              city: String(o.city ?? 'besatt'),
            }
          : null,
      };
    }
    if ((d.version ?? 0) > SAVE_VERSION || !d.hero) return null;
    d.hero.inv ??= [];
    d.hero.equip ??= {};
    if (d.game) d.game.killed = Array.isArray(d.game.killed) ? d.game.killed : [...((d.game.killed as Iterable<string> | undefined) ?? [])];
    return d as SaveFile;
  }

  listHeroes(): HeroIndexEntry[] {
    return (this.read<HeroIndexEntry[]>(K_INDEX) ?? []).filter((h) => !!h?.id);
  }

  load(id: string): SaveFile | null {
    return SaveManager.migrate(this.read(heroKey(id)));
  }

  lastHeroId(): string | null {
    return this.read<{ last?: string }>(K_LAST)?.last ?? null;
  }

  validName(name: string, ignoreId?: string): string {
    const n = name.trim();
    if (n.length < 2 || n.length > 16) return 'Namnet måste vara 2–16 tecken.';
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(n)) return 'Bara bokstäver, siffror, mellanslag, - och _.';
    if (this.listHeroes().some((h) => h.id !== ignoreId && h.name.toLowerCase() === n.toLowerCase()))
      return 'Det finns redan en hjälte med det namnet.';
    return '';
  }

  createHero(name: string, cls: string): SaveFile {
    const err = this.validName(name);
    if (err) throw new Error(err);
    if (this.listHeroes().length >= MAX_HEROES) throw new Error('Alla hjälteplatser är upptagna.');
    const id = 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const d: SaveFile = {
      version: SAVE_VERSION,
      hero: { id, name: name.trim(), cls, level: 1, xp: 0, gold: 0, inv: [], equip: {}, fresh: true },
      game: null,
      savedAt: Date.now(),
    };
    this.write(heroKey(id), d);
    this.write(K_INDEX, [...this.listHeroes(), { id, name: d.hero.name, cls, level: 1, savedAt: d.savedAt }]);
    return d;
  }

  deleteHero(id: string): void {
    this.store.removeItem(heroKey(id));
    this.write(
      K_INDEX,
      this.listHeroes().filter((h) => h.id !== id),
    );
    if (this.lastHeroId() === id) this.store.removeItem(K_LAST);
  }

  save(d: SaveFile): boolean {
    d.version = SAVE_VERSION;
    d.savedAt = Date.now();
    d.found = Object.keys(this.found()).length;
    if (!this.write(heroKey(d.hero.id), d)) return false;
    this.write(
      K_INDEX,
      this.listHeroes().map((x) => (x.id === d.hero.id ? { ...x, cls: d.hero.cls, level: d.hero.level, savedAt: d.savedAt } : x)),
    );
    this.write(K_LAST, { version: SAVE_VERSION, last: d.hero.id });
    return true;
  }

  /** Session ur sparfilens game-del (Fortsätt) eller en ny (Nytt game). */
  sessionFor(d: SaveFile, continueGame: boolean): Session {
    return continueGame && d.game ? new Session(d.game.seed, d.game.killed) : new Session(Rng.newSeed());
  }

  found(): Record<string, FoundEntry> {
    return this.read<Record<string, FoundEntry>>(K_FOUND) ?? {};
  }

  /** Registrerar första upplock per föremåls-id. Returnerar true om det var första gången. */
  recordFound(id: string, info: Omit<FoundEntry, 'first'>): boolean {
    const f = this.found();
    if (f[id]) return false;
    f[id] = { first: new Date().toISOString(), ...info };
    this.write(K_FOUND, f);
    return true;
  }
}
