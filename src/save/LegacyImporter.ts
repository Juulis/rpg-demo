import { isRecord, readJson } from '../core/storage';
import type { HeroRoster } from './HeroRoster';
import type { SaveRepository } from './SaveRepository';
import sv from '../i18n/sv.json';
import { HERO_CLASSES } from './types';
import type { ItemInstance, Equipment } from '../core/GameContext';

/**
 * Engångsmigrering: äldre sparningar per klass ('rk_inv_<klass>') blir hjältar, men bara om inget hjälteindex finns.
 * Nyckeln läses aldrig annars och skrivs aldrig (issue #12). Tas bort efter övergångsperioden.
 */
export class LegacyImporter {
  static readonly PREFIX = 'rk_inv_';

  constructor(
    private readonly repo: SaveRepository,
    private readonly roster: HeroRoster,
  ) {}

  run(): number {
    if (this.repo.hasIndex()) return 0;
    this.repo.writeIndex([]);
    let n = 0;
    for (const c of HERO_CLASSES) {
      const o = readJson(this.repo.store, LegacyImporter.PREFIX + c.id);
      if (!isRecord(o) || !Array.isArray(o.inv)) continue;
      try {
        const d = this.roster.create(sv.classes[c.id], c.id); // sparat hjältenamn (data), inte UI-text;
        d.hero.inv = o.inv as ItemInstance[];
        d.hero.equip = isRecord(o.equip) ? (o.equip as Equipment) : {};
        d.hero.gold = typeof o.gold === 'number' ? o.gold : 0;
        delete d.hero.fresh;
        this.repo.save(d, false);
        n++;
      } catch {
        /* hoppa över trasig post */
      }
    }
    return n;
  }
}
