import { isRecord } from '../core/json';
import type { Equipment, ItemInstance } from '../core/GameContext';
import type { HeroRoster } from './HeroRoster';
import type { SaveRepository } from './SaveRepository';
import { HERO_CLASSES } from './types';

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

  async run(): Promise<number> {
    if (await this.repo.hasIndex()) return 0;
    await this.repo.writeIndex([]);
    let n = 0;
    for (const c of HERO_CLASSES) {
      const o = await this.repo.loadRaw(LegacyImporter.PREFIX + c.id);
      if (!isRecord(o) || !Array.isArray(o.inv)) continue;
      try {
        const d = await this.roster.create(c.name, c.id);
        d.hero.inv = o.inv as ItemInstance[];
        d.hero.equip = isRecord(o.equip) ? (o.equip as Equipment) : {};
        d.hero.gold = typeof o.gold === 'number' ? o.gold : 0;
        delete d.hero.fresh;
        await this.roster.store(d);
        n++;
      } catch {
        /* hoppa över trasig post */
      }
    }
    return n;
  }
}
