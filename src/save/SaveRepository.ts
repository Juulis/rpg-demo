import { isRecord, readJson, writeJson, type KeyValueStore } from '../core/storage';
import { SaveMigrator } from './SaveMigrator';
import { SAVE_VERSION, type HeroIndexEntry, type SaveFile } from './types';

/**
 * localStorage-lagring, bakåtkompatibel med js/save.js:
 *   rpg_heroes   [{id, name, cls, level, savedAt}]
 *   rpg_hero_<id> {version, hero, game, found?, savedAt}
 *   rpg_save     {version, last}
 */
export class SaveRepository {
  static readonly K_INDEX = 'rpg_heroes';
  static readonly K_LAST = 'rpg_save';
  static readonly K_FOUND = 'rpg_found';
  static heroKey = (id: string): string => `rpg_hero_${id}`;

  constructor(
    readonly store: KeyValueStore,
    private readonly migrator = new SaveMigrator(),
  ) {}

  hasIndex(): boolean {
    return this.store.get(SaveRepository.K_INDEX) !== null;
  }

  index(): HeroIndexEntry[] {
    const raw = readJson(this.store, SaveRepository.K_INDEX);
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

  writeIndex(list: HeroIndexEntry[]): boolean {
    return writeJson(this.store, SaveRepository.K_INDEX, list);
  }

  load(id: string): SaveFile | null {
    return this.migrator.migrate(readJson(this.store, SaveRepository.heroKey(id)));
  }

  /** Skriver sparfilen och uppdaterar index + senast spelad. */
  save(d: SaveFile, markLast = true): boolean {
    if (!writeJson(this.store, SaveRepository.heroKey(d.hero.id), d)) return false;
    const entry: HeroIndexEntry = {
      id: d.hero.id,
      name: d.hero.name,
      cls: d.hero.cls,
      level: d.hero.level,
      ...(d.savedAt ? { savedAt: d.savedAt } : {}),
    };
    const idx = this.index();
    const i = idx.findIndex((x) => x.id === d.hero.id);
    if (i >= 0) idx[i] = entry;
    else idx.push(entry);
    this.writeIndex(idx);
    if (markLast) writeJson(this.store, SaveRepository.K_LAST, { version: SAVE_VERSION, last: d.hero.id });
    return true;
  }

  remove(id: string): void {
    this.store.remove(SaveRepository.heroKey(id));
    this.writeIndex(this.index().filter((h) => h.id !== id));
    if (this.lastHeroId() === id) this.store.remove(SaveRepository.K_LAST);
  }

  lastHeroId(): string | null {
    const r = readJson(this.store, SaveRepository.K_LAST);
    return isRecord(r) && typeof r.last === 'string' ? r.last : null;
  }

  foundCount(): number {
    const f = readJson(this.store, SaveRepository.K_FOUND);
    return isRecord(f) ? Object.keys(f).length : 0;
  }
}
