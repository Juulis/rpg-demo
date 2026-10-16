import { isRecord, parseJson } from '../core/json';
import type { SaveBackend } from './backend/SaveBackend';
import { SaveMigrator } from './SaveMigrator';
import { SAVE_VERSION, type HeroIndexEntry, type SaveFile } from './types';

/**
 * Sparfiler via ett injicerat SaveBackend (DOM-fri). Nycklar, bakåtkompatibla med js/save.js:
 *   rpg_heroes   [{id, name, cls, level, savedAt}]
 *   rpg_hero_<id> {version, hero, game, found?, savedAt}
 *   rpg_save     {version, last}
 * Skrivningar köas, så att indexet (läs–ändra–skriv) inte kan skrivas över av en samtidig sparning.
 */
export class SaveRepository {
  static readonly K_INDEX = 'rpg_heroes';
  static readonly K_LAST = 'rpg_save';
  static readonly K_FOUND = 'rpg_found';
  static heroKey = (id: string): string => `rpg_hero_${id}`;

  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    readonly backend: SaveBackend,
    private readonly migrator = new SaveMigrator(),
  ) {}

  private async readJson(key: string): Promise<unknown> {
    return parseJson(await this.backend.load(key));
  }

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job);
    this.queue = run.catch(() => undefined);
    return run;
  }

  async hasIndex(): Promise<boolean> {
    return (await this.backend.load(SaveRepository.K_INDEX)) !== null;
  }

  async index(): Promise<HeroIndexEntry[]> {
    const raw = await this.readJson(SaveRepository.K_INDEX);
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

  writeIndex(list: HeroIndexEntry[]): Promise<void> {
    return this.enqueue(() => this.backend.save(SaveRepository.K_INDEX, JSON.stringify(list)));
  }

  async load(id: string): Promise<SaveFile | null> {
    return this.migrator.migrate(await this.readJson(SaveRepository.heroKey(id)));
  }

  /** Rå (omigrerad) post, t.ex. för engångsimport av äldre nycklar. */
  loadRaw(key: string): Promise<unknown> {
    return this.readJson(key);
  }

  /** Skriver sparfilen och uppdaterar index + senast spelad. false om lagringen misslyckas. */
  save(d: SaveFile, markLast = true, withFound = false): Promise<boolean> {
    return this.enqueue(async () => {
      try {
        if (withFound) d.found = await this.foundCount();
        await this.backend.save(SaveRepository.heroKey(d.hero.id), JSON.stringify(d));
        const entry: HeroIndexEntry = {
          id: d.hero.id,
          name: d.hero.name,
          cls: d.hero.cls,
          level: d.hero.level,
          ...(d.savedAt ? { savedAt: d.savedAt } : {}),
        };
        const idx = await this.index();
        const i = idx.findIndex((x) => x.id === d.hero.id);
        if (i >= 0) idx[i] = entry;
        else idx.push(entry);
        await this.backend.save(SaveRepository.K_INDEX, JSON.stringify(idx));
        if (markLast) await this.backend.save(SaveRepository.K_LAST, JSON.stringify({ version: SAVE_VERSION, last: d.hero.id }));
        return true;
      } catch (e) {
        console.warn('Sparning misslyckades', e);
        return false;
      }
    });
  }

  remove(id: string): Promise<void> {
    return this.enqueue(async () => {
      await this.backend.remove(SaveRepository.heroKey(id));
      const idx = (await this.index()).filter((h) => h.id !== id);
      await this.backend.save(SaveRepository.K_INDEX, JSON.stringify(idx));
      if ((await this.lastHeroId()) === id) await this.backend.remove(SaveRepository.K_LAST);
    });
  }

  async lastHeroId(): Promise<string | null> {
    const r = await this.readJson(SaveRepository.K_LAST);
    return isRecord(r) && typeof r.last === 'string' ? r.last : null;
  }

  async foundCount(): Promise<number> {
    const f = await this.readJson(SaveRepository.K_FOUND);
    return isRecord(f) ? Object.keys(f).length : 0;
  }
}
