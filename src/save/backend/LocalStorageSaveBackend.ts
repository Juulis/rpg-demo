import type { Equipment, HeroSave, ItemInstance } from '../../core/GameContext';
import { isRecord, parseJson } from '../../core/json';
import { Rng } from '../../core/Rng';
import type { FoundEntry, SaveBackend } from '../../core/SaveBackend';
import { LocalStore, type KeyValueStore } from '../../core/storage';
import { fromHeroSave, readFoundItemsFromSave, toHeroSave } from '../convert';
import { GlobalFoundMigration } from '../GlobalFoundMigration';
import { parseHeroIndex } from '../heroIndex';
import { SaveMigrator } from '../SaveMigrator';
import { HERO_CLASSES, SAVE_VERSION, type HeroIndexEntry, type SaveFile } from '../types';

type ListEntry = Awaited<ReturnType<SaveBackend['list']>>[number];

/**
 * core-SaveBackend ovanpå KeyValueStore (LocalStore i webbläsaren, MemoryStore i tester).
 */
export class LocalStorageSaveBackend implements SaveBackend {
  static readonly K_INDEX = 'rpg_heroes';
  static readonly K_LAST = 'rpg_save';
  static readonly SETTING_PREFIX = 'rpg_setting_';
  static readonly LEGACY_FOG_PREFIX = 'rpg_karta_';
  static readonly LEGACY_PREFIX = 'rk_inv_';
  static readonly LEGACY_VOL = 'rpg_vol';
  static readonly LEGACY_MUTE = 'rpg_mute';
  static heroKey = (id: string): string => `rpg_hero_${id}`;

  private imported = false;
  private migratedFound = false;
  private activeHeroId: string | null = null;
  private readonly foundCache = new Map<string, Record<string, FoundEntry>>();
  private readonly removed = new Set<string>();

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
    if (!heroId || this.removed.has(heroId) || !this.heroExists(heroId)) return false;
    const map = await this.foundMapFor(heroId);
    if (map[id]) return false;
    map[id] = entry;
    this.foundCache.set(heroId, map);
    this.persistFoundItems(heroId, map);
    return true;
  }

  async unmarkFound(id: string): Promise<void> {
    const heroId = this.activeHeroId;
    if (!heroId || this.removed.has(heroId) || !this.heroExists(heroId)) return;
    const map = await this.foundMapFor(heroId);
    if (!map[id]) return;
    const next: Record<string, FoundEntry> = {};
    for (const [k, v] of Object.entries(map)) if (k !== id) next[k] = v;
    this.foundCache.set(heroId, next);
    this.persistFoundItems(heroId, next);
  }

  async getSetting(key: string): Promise<string | null> {
    this.ensureReady();
    const v = this.kv.get(LocalStorageSaveBackend.SETTING_PREFIX + key);
    if (v !== null) return v;
    if (key === 'vol') {
      const leg = this.kv.get(LocalStorageSaveBackend.LEGACY_VOL);
      if (leg !== null) {
        await this.setSetting('vol', leg);
        return leg;
      }
    }
    if (key === 'mute') {
      const leg = this.kv.get(LocalStorageSaveBackend.LEGACY_MUTE);
      if (leg !== null) {
        await this.setSetting('mute', leg);
        return leg;
      }
    }
    return null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.ensureReady();
    this.kv.set(LocalStorageSaveBackend.SETTING_PREFIX + key, value);
  }

  async getFogMap(heroId: string): Promise<Record<string, string>> {
    this.ensureReady();
    if (this.removed.has(heroId)) return {};
    const file = this.readSaveFile(heroId);
    if (!file) return {};
    const merged = this.mergeLegacyFog(heroId, file.fog ?? {});
    if (merged !== file.fog) {
      file.fog = merged;
      file.savedAt = Date.now();
      this.write(LocalStorageSaveBackend.heroKey(heroId), file);
    }
    return merged;
  }

  async setFog(heroId: string, zone: string, base64: string): Promise<void> {
    this.ensureReady();
    if (this.removed.has(heroId) || !this.heroExists(heroId)) return;
    const file = this.readSaveFile(heroId);
    if (!file) return;
    file.fog = { ...(file.fog ?? {}), [zone]: base64 };
    file.savedAt = Date.now();
    if (!this.write(LocalStorageSaveBackend.heroKey(heroId), file)) {
      throw new Error('Dimma kunde inte sparas (lagring full?)');
    }
  }

  async clearFog(heroId: string): Promise<void> {
    this.ensureReady();
    const file = this.readSaveFile(heroId);
    if (!file?.fog) return;
    const { fog, ...rest } = file;
    void fog;
    const cleared: SaveFile = { ...rest, savedAt: Date.now() };
    this.write(LocalStorageSaveBackend.heroKey(heroId), cleared);
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
    const d = this.readSaveFile(id);
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
      if (this.removed.has(id)) {
        return Promise.reject(new Error('hjälten finns inte'));
      }
      const prev = this.readSaveFile(id);
      const items = this.foundCache.get(id) ?? readFoundItemsFromSave(prev);
      const d: SaveFile = fromHeroSave(data, items);
      d.hero.id = id;
      if (prev?.fog) d.fog = prev.fog;
      d.savedAt = Date.now();
      this.writeFile(d);
      if (d.game && id === this.activeHeroId) {
        this.write(LocalStorageSaveBackend.K_LAST, { version: SAVE_VERSION, last: id });
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  }

  remove(id: string): Promise<void> {
    this.ensureReady();
    this.removed.add(id);
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

  private heroExists(id: string): boolean {
    return this.index().some((h) => h.id === id);
  }

  private readSaveFile(id: string): SaveFile | null {
    return this.migrator.migrate(this.read(LocalStorageSaveBackend.heroKey(id)));
  }

  private mergeLegacyFog(heroId: string, fog: Record<string, string>): Record<string, string> {
    const out = { ...fog };
    const prefix = `${LocalStorageSaveBackend.LEGACY_FOG_PREFIX}${heroId}_`;
    for (const k of this.kv.keys()) {
      if (!k.startsWith(prefix)) continue;
      const zone = k.slice(prefix.length);
      const data = this.kv.get(k);
      if (data && !out[zone]) out[zone] = data;
    }
    return out;
  }

  private async foundMapFor(heroId: string): Promise<Record<string, FoundEntry>> {
    const cached = this.foundCache.get(heroId);
    if (cached) return cached;
    const items = readFoundItemsFromSave(this.read(LocalStorageSaveBackend.heroKey(heroId)));
    const map = items ?? {};
    this.foundCache.set(heroId, map);
    return map;
  }

  private persistFoundItems(heroId: string, map: Record<string, FoundEntry>): void {
    const file = this.readSaveFile(heroId);
    if (!file) return;
    file.foundItems = map;
    file.found = Object.keys(map).length;
    file.savedAt = Date.now();
    this.write(LocalStorageSaveBackend.heroKey(heroId), file);
  }

  private read(key: string): unknown {
    return parseJson(this.kv.get(key));
  }
  private write(key: string, value: unknown): boolean {
    try {
      this.kv.set(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Sparning misslyckades', e);
      return false;
    }
  }

  private writeFile(d: SaveFile): void {
    const prev = this.readSaveFile(d.hero.id);
    if (prev?.fog && !d.fog) d.fog = prev.fog;
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
    return parseHeroIndex(this.read(LocalStorageSaveBackend.K_INDEX));
  }

  private lastId(): string | null {
    const r = this.read(LocalStorageSaveBackend.K_LAST);
    return isRecord(r) && typeof r.last === 'string' ? r.last : null;
  }

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
