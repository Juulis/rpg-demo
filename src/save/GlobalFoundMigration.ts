import { isRecord, parseJson } from '../core/json';
import type { KeyValueStore } from '../core/storage';
import { parseGlobalFoundMap } from './foundItems';
import { parseHeroIndex } from './heroIndex';
import { SaveMigrator } from './SaveMigrator';
import type { HeroIndexEntry } from './types';

export const MIGRATED_KEY = 'rpg_found_per_hero_v1';
const K_FOUND = 'rpg_found';
const K_LAST = 'rpg_save';
const K_INDEX = 'rpg_heroes';
const heroKey = (id: string): string => `rpg_hero_${id}`;

/**
 * Engångsimport av globalt rpg_found (legacy, delat mellan hjältar i 3D).
 *
 * Regel: hela registret kopieras till **en** hjälte:
 *   1) rpg_save.last om den pekar på en befintlig hjälte i indexet
 *   2) annars hjälten med högst savedAt i rpg_heroes (vid lika: första i indexet)
 *
 * Flaggan rpg_found_per_hero_v1 sätts bara när importen lyckats eller när det inte finns något att importera.
 * Om globala fynd finns men ingen hjälte finns ännu lämnas flaggan unset så importen försöker igen senare.
 */
export class GlobalFoundMigration {
  constructor(
    private readonly kv: KeyValueStore,
    private readonly migrator = new SaveMigrator(),
  ) {}

  run(): void {
    if (this.kv.get(MIGRATED_KEY) === '1') return;
    const global = parseGlobalFoundMap(parseJson(this.kv.get(K_FOUND)));
    if (!global) {
      this.kv.set(MIGRATED_KEY, '1');
      return;
    }
    const heroes = this.index();
    if (!heroes.length) return;

    const target = this.pickTarget(heroes);
    if (!target) return;

    const raw = parseJson(this.kv.get(heroKey(target)));
    const file = this.migrator.migrate(raw);
    if (!file) return;

    const merged = { ...global, ...(file.foundItems ?? {}) };
    file.foundItems = merged;
    file.found = Object.keys(merged).length;
    this.kv.set(heroKey(target), JSON.stringify(file));
    this.kv.set(MIGRATED_KEY, '1');
  }

  /** Publik för tester: samma regel som run(). */
  pickTarget(heroes: HeroIndexEntry[]): string | null {
    const ids = new Set(heroes.map((h) => h.id));
    const last = this.lastHeroId();
    if (last && ids.has(last)) return last;
    const first = heroes[0];
    if (!first) return null;
    let best = first;
    for (const h of heroes) {
      const a = h.savedAt ?? 0;
      const b = best.savedAt ?? 0;
      if (a > b) best = h;
    }
    return best.id;
  }

  private index(): HeroIndexEntry[] {
    return parseHeroIndex(parseJson(this.kv.get(K_INDEX)));
  }

  private lastHeroId(): string | null {
    const r = parseJson(this.kv.get(K_LAST));
    return isRecord(r) && typeof r.last === 'string' ? r.last : null;
  }
}
