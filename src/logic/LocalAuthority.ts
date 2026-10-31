import { effectiveMagicFind } from '../dev/DevCheats';
import type { GameAuthority } from '../core/GameAuthority';
import type { HeroStats, Loot } from './loot/Loot';
import type { Drop } from './loot/types';
import { CombatRules, type MonsterSnapshot } from './CombatRules';

/** Lokal implementation av GameAuthority: kör den rena spellogiken i klienten. */
export class LocalAuthority implements GameAuthority {
  private readonly rules: CombatRules;

  constructor(
    private readonly L: Loot,
    rules: CombatRules,
  ) {
    this.rules = rules;
  }

  heroHit(st: HeroStats, heroLvl: number, m: MonsterSnapshot, mult: number, extraCritChance?: number) {
    return this.rules.heroHit(st, heroLvl, m, mult, extraCritChance);
  }

  monsterHit(o: Parameters<GameAuthority['monsterHit']>[0]) {
    return this.rules.monsterHit(o);
  }

  killReward(o: Parameters<GameAuthority['killReward']>[0]): { xp: number; drops: Drop[] } {
    const xp = this.rules.monsterXp(o.m, o.heroLvl);
    const mf = effectiveMagicFind(o.mf);
    const { drops } = this.L.rollDrops({ id: o.m.id, mlvl: o.m.lvl, ilvl: o.ilvl, mf, goldFind: o.goldFind, firstKill: o.firstKill });
    for (let i = 0; i < o.extraRolls; i++)
      drops.push(
        ...this.L.rollDrops({
          id: o.m.id,
          mlvl: o.m.lvl,
          ilvl: o.ilvl,
          mf: effectiveMagicFind(o.mf + (o.qualityMult - 1) * 100),
          goldFind: o.goldFind,
        }).drops,
      );
    return { xp, drops };
  }
}
