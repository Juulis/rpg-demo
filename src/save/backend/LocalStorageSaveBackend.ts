import type { Equipment, HeroSave, ItemInstance } from '../../core/GameContext';
import { isRecord, parseJson } from '../../core/json';
import { Rng } from '../../core/Rng';
import type { FoundEntry, SaveBackend } from '../../core/SaveBackend';
import { LocalStore, type KeyValueStore } from '../../core/storage';
import { fromHeroSave, readFoundItems, toHeroSave } from '../convert';
import { GlobalFoundMigration } from '../GlobalFoundMigration';
import { SaveMigrator } from '../SaveMigrator';
import { HERO_CLASSES, SAVE_VERSION, type HeroIndexEntry, type SaveFile } from '../types';

type ListEntry = Awaited<ReturnType<SaveBackend['list']>>[number];

/**
 * core-SaveBackend ovanpå KeyValueStore (LocalStore i webbläsaren, MemoryStore i tester).
 * Lagringsformatet är bakåtkompatibelt med js/save.js:
 *   rpg_heroes   [{id, name, cls, level, savedAt}]
 *   rpg_hero_<id> {version, hero, game, found?, foundItems?, savedAt}
 *   rpg_save     {version, last}
 * Kontrakt: list() returnerar senast sparade hjälte först.
 */
export class LocalStorageSaveBackend implements SaveBackend {
  static readonly K_INDEX = 'rpg_heroes';
  static readonly K_LAST = 'rpg_save';
  static readonly K_FOUND = 'rpg_found';
  static readonly LEGACY_PREFIX = 'rk_inv_';
  static heroKey = (id: string): string => `rpg_hero_${id}`;

  private imported = false;
  private migratedFound = false;
  private activeHeroId: string | null = null;
  private readonly foundCache = new Map<string, Record<string, FoundEntry>>();

  constructor(
    private readonly kv: KeyValueStore = new LocalStore(),
    private readonly migrator = new SaveMigrator(),
    private readonly newId: () => string = () => `h${Date.now().toString(36)}${Rng.newSeed().toString(36).slice(0, 4)}`,
  ) {}

  setActiveHero(heroId: string | null): void {
    this.activeHeroId = heroId;
  }

  async markFound(id: string, entry: FoundEntry): Promise<boolean> {
    const heroId = this.activeHeroId;
    if (!heroId) return false;
    const map = await this.foundMapFor(heroId);
    if (map[id]) return false;
    map[id] = entry;
    this.foundCache.set(heroId, map);
    await this.writeFoundToHero(heroId, map);
    return true;
  }

  list(): Promise<ListEntry[]> {
    this.ensureReady();
    const idx = this.index();
    const last = this.lastId();
    const order = idx
      .map((h, i) => ({ h, i }))
      .sort((a, b) => (b.h.savedAt ?? 0) - (a.h.savedAt ?? 0) || a.i - b.i)
      .map(({ h }) => h);
    const li = order.findIndex((h) => h.id === last);
    if (li > 0) order.unshift(...order.splice(li, 1));
    return Promise.resolve(order.map(({ id, name, cls, level, savedAt }) => ({ id, name, cls, level, savedAt })));
  }

  async load(id: string): Promise<HeroSave | null> {
    this.ensureReady();
    const d = this.migrator.migrate(this.read(LocalStorageSaveBackend.heroKey(id)));
    if (!d) return null;
    const items = d.foundItems ?? (await this.foundMapFor(id));
    if (items) {
      d.foundItems = items;
      d.found = Object.keys(items).length;
      this.foundCache.set(id, items);
    }
    const save = toHeroSave(d);
    if (d.foundItems) save.foundItems = d.foundItems;
    return save;
  }

  save(id: string, data: HeroSave): Promise<void> {
    try {
      this.ensureReady();
      const items = this.foundCache.get(id) ?? readFoundItems(this.read(LocalStorageSaveBackend.heroKey(id)));
      const d: SaveFile = fromHeroSave(data, items);
      d.hero.id = id;
      d.savedAt = Date.now();
      this.writeFile(d);
      if (d.game) this.write(LocalStorageSaveBackend.K_LAST, { version: SAVE_VERSION, last: id });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  }

  remove(id: string): Promise<void> {
    this.kv.remove(LocalStorageSaveBackend.heroKey(id));
    this.foundCache.delete(id);
    this.write(
      LocalStorageSaveBackend.K_INDEX,
      this.index().filter((h) => h.id !== id),
    );
    if (this.lastId() === id) this.kv.remove(LocalStorageSaveBackend.K_LAST);
    return Promise.resolve();
  }

  lastPlayedHeroId(): Promise<string | null> {
    this.ensureReady();
    return Promise.resolve(this.lastId());
  }

  private ensureReady(): void {
    if (!this.migratedFound) {
      new GlobalFoundMigration(this.kv, this.migrator).run();
      this.migratedFound = true;
    }
    this.importLegacy();
  }

  private async foundMapFor(heroId: string): Promise<Record<string, FoundEntry>> {
    const cached = this.foundCache.get(heroId);
    if (cached) return cached;
    const raw = this.read(LocalStorageSaveBackend.heroKey(heroId));
    let items = readFoundItems(raw);
    if (!items) {
      const global = this.readGlobalFound();
      items = GlobalFoundMigration.mergeLegacyCount(raw, global);
    }
    const map = items ?? {};
    this.foundCache.set(heroId, map);
    return map;
  }

  private readGlobalFound(): Record<string, FoundEntry> | null {
    const raw = parseJson(this.kv.get(LocalStorageSaveBackend.K_FOUND));
    if (!isRecord(raw)) return null;
    const out: Record<string, FoundEntry> = {};
    for (const [id, v] of Object.entries(raw)) {
      if (!isRecord(v) || typeof v.base !== 'string' || typeof v.first !== 'string') continue;
      out[id] = {
        first: v.first,
        quality: typeof v.quality === 'string' ? v.quality : 'normal',
        base: v.base,
        ilvl: typeof v.ilvl === 'number' ? v.ilvl : 1,
      };
    }
    return Object.keys(out).length ? out : null;
  }

  private async writeFoundToHero(heroId: string, map: Record<string, FoundEntry>): Promise<void> {
    const key = LocalStorageSaveBackend.heroKey(heroId);
    const file = this.migrator.migrate(this.read(key));
    if (!file) return;
    file.foundItems = map;
    file.found = Object.keys(map).length;
    file.savedAt = Date.now();
    this.write(key, file);
  }

  private read(key: string): unknown {
    return parseJson(this.kv.get(key));
  }
  private write(key: string, value: unknown): void {
    this.kv.set(key, JSON.stringify(value));
  }

  private writeFile(d: SaveFile): void {
    this.write(LocalStorageSaveBackend.heroKey(d.hero.id), d);
    const entry: HeroIndexEntry = { id: d.hero.id, name: d.hero.name, cls: d.hero.cls, level: d.hero.level };
    if (d.savedAt) entry.savedAt = d.savedAt;
    const idx = this.index();
    const i = idx.findIndex((x) => x.id === d.hero.id);
    if (i >= 0) idx[i] = entry;
    else idx.push(entry);
    this.write(LocalStorageSaveBackend.K_INDEX, idx);
  }

  private index(): HeroIndexEntry[] {
    const raw = this.read(LocalStorageSaveBackend.K_INDEX);
    if (!Array.isArray(raw)) return [];
    return raw.filter(isRecord).flatMap((h): HeroIndexEntry[] =>
      typeof h.id === 'string' && h.id
        ? [
            {
              id: h.id,
              name: typeof h.name === 'string' ? h.name : h.id,
              cls: typeof h.cls === 'string' ? h.cls : 'riddare',
              level: typeof h.level === 'number' ? h.level : 1,
              ...(typeof h.savedAt === 'number' ? { savedAt: h.savedAt } : {}),
            },
          ]
        : [],
    );
  }

  private lastId(): string | null {
    const r = this.read(LocalStorageSaveBackend.K_LAST);
    return isRecord(r) && typeof r.last === 'string' ? r.last : null;
  }

  /** Engångsmigrering: rk_inv_<klass> blir hjältar, bara om inget hjälteindex finns. */
  private importLegacy(): void {
    if (this.imported) return;
    this.imported = true;
    if (this.kv.get(LocalStorageSaveBackend.K_INDEX) !== null) return;
    this.write(LocalStorageSaveBackend.K_INDEX, []);
    for (const c of HERO_CLASSES) {
      const o = this.read(LocalStorageSaveBackend.LEGACY_PREFIX + c.id);
      if (!isRecord(o) || !Array.isArray(o.inv)) continue;
      const raw: SaveFile = {
        version: SAVE_VERSION,
        hero: {
          id: this.newId(),
          name: c.name,
          cls: c.id,
          level: 1,
          xp: 0,
          gold: typeof o.gold === 'number' ? o.gold : 0,
          inv: o.inv as ItemInstance[],
          equip: isRecord(o.equip) ? (o.equip as Equipment) : {},
        },
        game: null,
        savedAt: Date.now(),
      };
      const d = this.migrator.migrate(raw);
      if (d) this.writeFile(d);
    }
  }
}
