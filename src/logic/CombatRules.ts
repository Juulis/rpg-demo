import { xpMultiplier } from '../dev/DevCheats';
import type { Rng } from '../core/Rng';
import { DATA } from '../data';
import type { DamageType } from '../data/types';
import type { HeroStats, Loot } from './loot/Loot';

/** Vad reglerna behöver veta om ett monster (ren data, ingen figur). */
export interface MonsterSnapshot {
  id: string;
  lvl: number;
  hp: number;
  max: number;
  defense: number;
  boss: boolean;
  family: string;
  weak: DamageType[];
  resist: DamageType[];
  immune: boolean;
  vulnerable: boolean;
  /** Sköld framifrån (skelett_vakt): halv skada. */
  shieldedFront: boolean;
  xp: number;
  xpMult: number;
}
export interface HeroHitResult {
  hit: boolean;
  dmg: number;
  crit: boolean;
  strong: number;
  /** Familjsmultiplikator (>1 svag, <1 resistent). */
  fm: number;
}
export type MonsterHitResult = { kind: 'miss' } | { kind: 'block' } | { kind: 'hit'; dmg: number; reduced: boolean };

/** Stridsregler enligt attribut.json och monsterfamiljer.json. Ren TS, seedad slump. */
export class CombatRules {
  constructor(
    private readonly L: Loot,
    private readonly rng: Rng,
  ) {}

  heroHit(st: HeroStats, heroLvl: number, m: MonsterSnapshot, mult: number): HeroHitResult {
    const R = this.rng;
    if (!m.immune && R.next() > this.L.hitChance(st.AR, 15 + 8 * m.lvl + m.defense * 2, heroLvl, m.lvl))
      return { hit: false, dmg: 0, crit: false, strong: 0, fm: 1 };
    const rules = DATA.families.multiplier_rules;
    const type = st.type as DamageType;
    const fm = m.weak.includes(type) ? rules.svag : m.resist.includes(type) ? rules.resistent : 1;
    const crit = R.next() < st.crit;
    const fam = this.L.monsterFamily(m.id) ?? m.family;
    let dmg = R.float(st.dmgMin, st.dmgMax) * mult * fm * (1 + (st.vs[fam] ?? 0)) * (crit ? DATA.classes.meta.crit_multiplier : 1);
    if (m.shieldedFront) dmg *= 0.5;
    dmg = m.immune ? 0 : Math.max(1, Math.round(dmg - (m.vulnerable ? 0 : m.defense)));
    let strong = 0;
    if (dmg > 0 && R.next() < st.strong) {
      strong = Math.round(m.boss ? Math.min(m.hp * 0.1, m.max * 0.03) : m.hp * 0.25);
      dmg += strong;
    }
    return { hit: true, dmg, crit, strong, fm };
  }

  /** Monster träffar hjälten: träffchans, sköldblock (halverat i rörelse, aldrig bakifrån), aktiv blockering, försvar. */
  monsterHit(o: {
    raw: number;
    monsterLvl: number;
    st: HeroStats;
    heroLvl: number;
    front: boolean;
    moving: boolean;
    stamina: number;
    blocking: boolean;
  }): MonsterHitResult {
    const R = this.rng;
    const { st } = o;
    if (R.next() > this.L.hitChance(15 + 8 * o.monsterLvl, 15 + 8 * o.heroLvl + st.defense * 2, o.monsterLvl, o.heroLvl))
      return { kind: 'miss' };
    if (st.block > 0 && o.front && o.stamina >= 5 && R.next() < st.block * (o.moving ? 0.5 : 1)) return { kind: 'block' };
    let d = o.raw;
    const reduced = o.blocking && o.front && o.stamina >= 5;
    if (reduced) d *= 0.3;
    return { kind: 'hit', dmg: Math.max(1, Math.round(d - st.defReduce)), reduced };
  }

  /** XP(L) = round(xp/10 · 3 · L^1,5) × avdrag efter nivåskillnad (boss golv 0,25). */
  monsterXp(m: Pick<MonsterSnapshot, 'lvl' | 'boss' | 'xp' | 'xpMult'>, heroLvl: number): number {
    const diff = heroLvl - m.lvl;
    const row = DATA.monsterLevels.xp_penalty.table.find((r) => r.hjalte_minus_monster === Math.max(-8, Math.min(12, diff)));
    let k = row ? row.xp_mult : 1;
    if (m.boss) k = Math.max(0.25, k);
    return Math.round(((m.xp || 10) / 10) * 3 * Math.pow(m.lvl, 1.5) * k * m.xpMult * xpMultiplier());
  }
}
