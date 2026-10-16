import type { Equipment, HeroSave, ItemInstance } from '../../core/GameContext';
import { isRecord, parseJson } from '../../core/json';
import { Rng } from '../../core/Rng';
import type { SaveBackend } from '../../core/SaveBackend';
import { LocalStore, type KeyValueStore } from '../../core/storage';
import { fromHeroSave, toHeroSave } from '../convert';
import { SaveMigrator } from '../SaveMigrator';
import { HERO_CLASSES, SAVE_VERSION, type HeroIndexEntry, type SaveFile } from '../types';

type ListEntry = Awaited<ReturnType<SaveBackend['list']>>[number];

/**
 * core-SaveBackend ovanpå localStorage (eller ett annat key-value-lager i tester).
 * Lagringsformatet är bakåtkompatibelt med js/save.js:
 *   rpg_heroes   [{id, name, cls, level, savedAt}]
 *   rpg_hero_<id> {version, hero, game, found?, savedAt}   (migreras via SaveMigrator)
 *   rpg_save     {version, last}
 * Kontrakt utöver interfacet: list() returnerar senast sparade hjälte först.
 * Engångsimporten av 'rk_inv_<klass>' (issue #12) är lagringsspecifik och ligger därför här.
 * Skrivningen sker synkront innan promisen löses, så att sparning vid beforeunload hinner klart.
 */
export class LocalStorageSaveBackend implements SaveBackend {
  static readonly K_INDEX = 'rpg_heroes';
  static readonly K_LAST = 'rpg_save';
  static readonly K_FOUND = 'rpg_found';
  static readonly LEGACY_PREFIX = 'rk_inv_';
  static heroKey = (id: string): string => `rpg_hero_${id}`;

  private imported = false;

  constructor(
    private readonly kv: KeyValueStore = new LocalStore(),
    private readonly migrator = new SaveMigrator(),
    private readonly newId: () => string = () => `h${Date.now().toString(36)}${Rng.newSeed().toString(36).slice(0, 4)}`,
  ) {}

  list(): Promise<ListEntry[]> {
    this.importLegacy();
    const idx = this.index();
    const last = this.lastId();
    const order = idx
      .map((h, i) => ({ h, i }))
      .sort((a, b) => (b.h.savedAt ?? 0) - (a.h.savedAt ?? 0) || a.i - b.i)
      .map(({ h }) => h);
    // senast spelad (rpg_save) först även om savedAt saknas
    const li = order.findIndex((h) => h.id === last);
    if (li > 0) order.unshift(...order.splice(li, 1));
    return Promise.resolve(order.map(({ id, name, cls, level }) => ({ id, name, cls, level })));
  }

  load(id: string): Promise<HeroSave | null> {
    const d = this.migrator.migrate(this.read(LocalStorageSaveBackend.heroKey(id)));
    return Promise.resolve(d ? toHeroSave(d) : null);
  }

  save(id: string, data: HeroSave): Promise<void> {
    try {
      const d: SaveFile = fromHeroSave(data);
      d.hero.id = id;
      d.found = this.foundCount();
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
    this.write(
      LocalStorageSaveBackend.K_INDEX,
      this.index().filter((h) => h.id !== id),
    );
    if (this.lastId() === id) this.kv.remove(LocalStorageSaveBackend.K_LAST);
    return Promise.resolve();
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

  private foundCount(): number {
    const f = this.read(LocalStorageSaveBackend.K_FOUND);
    return isRecord(f) ? Object.keys(f).length : 0;
  }

  /** Engångsmigrering: rk_inv_<klass> blir hjältar, bara om inget hjälteindex finns. Nyckeln skrivs aldrig. */
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
      const d = this.migrator.migrate(raw); // fixar gammalt startgear
      if (d) this.writeFile(d);
    }
  }
}
