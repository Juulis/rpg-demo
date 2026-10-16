import type { FoundEntry } from '../core/SaveBackend';
import { isRecord, parseJson } from '../core/json';
import type { KeyValueStore } from '../core/storage';
import { readFoundItems } from './convert';
import { SaveMigrator } from './SaveMigrator';

const MIGRATED_KEY = 'rpg_found_per_hero_v1';
const K_FOUND = 'rpg_found';
const K_LAST = 'rpg_save';
const heroKey = (id: string): string => `rpg_hero_${id}`;

/**
 * Engångsimport: globalt rpg_found (legacy) kopieras till senast spelade hjältes foundItems.
 * 2D använder därefter bara per-hjälte-registret; globala nyckeln lämnas för 3D på samma origin.
 */
export class GlobalFoundMigration {
  constructor(
    private readonly kv: KeyValueStore,
    private readonly migrator = new SaveMigrator(),
  ) {}

  run(): void {
    if (this.kv.get(MIGRATED_KEY) === '1') return;
    const global = this.readGlobalFound();
    if (!global || !Object.keys(global).length) {
      this.kv.set(MIGRATED_KEY, '1');
      return;
    }
    const heroId = this.lastHeroId();
    if (!heroId) {
      this.kv.set(MIGRATED_KEY, '1');
      return;
    }
    const key = heroKey(heroId);
    const raw = parseJson(this.kv.get(key));
    const file = this.migrator.migrate(raw);
    if (!file) {
      this.kv.set(MIGRATED_KEY, '1');
      return;
    }
    const merged = { ...global, ...(file.foundItems ?? {}) };
    file.foundItems = merged;
    file.found = Object.keys(merged).length;
    this.kv.set(key, JSON.stringify(file));
    this.kv.set(MIGRATED_KEY, '1');
  }

  private readGlobalFound(): Record<string, FoundEntry> | null {
    const raw = parseJson(this.kv.get(K_FOUND));
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
    return out;
  }

  private lastHeroId(): string | null {
    const r = parseJson(this.kv.get(K_LAST));
    return isRecord(r) && typeof r.last === 'string' ? r.last : null;
  }

  /** Hjälte utan foundItems men med legacy found-räknare får globala registret vid första läsning. */
  static mergeLegacyCount(raw: unknown, global: Record<string, FoundEntry> | null): Record<string, FoundEntry> | undefined {
    const existing = readFoundItems(raw);
    if (existing) return existing;
    if (!isRecord(raw) || typeof raw.found !== 'number' || raw.found <= 0) return undefined;
    return global && Object.keys(global).length ? { ...global } : undefined;
  }
}
