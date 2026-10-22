import type { HeroHitResult, MonsterHitResult, MonsterSnapshot } from '../logic/CombatRules';
import type { HeroStats } from '../logic/loot/Loot';
import type { Drop } from '../logic/loot/types';

/**
 * Den auktoritativa spellogiken (strid, loot-rull, XP). Klienten frågar alltid via detta interface.
 * Nu: LocalAuthority (src/logic) i webbläsaren. Senare kan samma logik köras på en server bakom samma interface.
 */
export interface GameAuthority {
  heroHit(st: HeroStats, heroLvl: number, m: MonsterSnapshot, mult: number): HeroHitResult;
  monsterHit(o: {
    raw: number;
    monsterLvl: number;
    st: HeroStats;
    heroLvl: number;
    front: boolean;
    moving: boolean;
    blocking: boolean;
  }): MonsterHitResult;
  /** Belöning när ett monster dör: XP och droppar. */
  killReward(o: {
    m: MonsterSnapshot;
    heroLvl: number;
    mf: number;
    goldFind: number;
    firstKill: boolean;
    ilvl: number;
    extraRolls: number;
    qualityMult: number;
  }): { xp: number; drops: Drop[] };
}
