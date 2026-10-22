import { DATA } from '../data';
import type { HeroStats } from './loot/Loot';

export interface DodgeProfile {
  distance: number;
  duration_s: number;
  iframes_s: number;
  cooldown_s: number;
  stamina_cost: number;
  shield?: boolean;
}

const meta = () =>
  (DATA.classes.meta as unknown as {
    dodge: {
      stamina_cost: number;
      cooldown_s: number;
      iframes_s: number;
      by_class: Record<string, { distance: number; duration_s: number; shield?: boolean }>;
    };
  }).dodge;

export function dodgeProfile(classId: string): DodgeProfile {
  const m = meta();
  const c = m.by_class[classId] ?? m.by_class.riddare ?? { distance: 2.5, duration_s: 0.32 };
  return {
    distance: c.distance,
    duration_s: c.duration_s,
    iframes_s: m.iframes_s,
    cooldown_s: m.cooldown_s,
    stamina_cost: m.stamina_cost,
    shield: c.shield,
  };
}

/** Uthållighetskostnad efter föremålsbonus (dodge_cost_pct). */
export function dodgeStaminaCost(st: HeroStats, base = meta().stamina_cost): number {
  const pct = (st as HeroStats & { dodgeCostPct?: number }).dodgeCostPct ?? 0;
  return Math.max(1, Math.round(base * (1 + pct)));
}

export function canStartDodge(o: {
  playing: boolean;
  dodgeCd: number;
  dodgeRemain: number;
  stamina: number;
  cost: number;
  atkT: number;
}): boolean {
  return o.playing && o.dodgeCd <= 0 && o.dodgeRemain <= 0 && o.atkT <= 0 && o.stamina >= o.cost;
}
