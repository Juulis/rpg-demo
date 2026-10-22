import { DATA } from '../data';

export interface DodgeProfile {
  distance: number;
  duration_s: number;
  iframes_s: number;
  cooldown_s: number;
  shield?: boolean;
}

const meta = () =>
  (
    DATA.classes.meta as unknown as {
      dodge: {
        cooldown_s: number;
        iframes_s: number;
        by_class: Record<string, { distance: number; duration_s: number; shield?: boolean }>;
      };
    }
  ).dodge;

export function dodgeProfile(classId: string): DodgeProfile {
  const m = meta();
  const c = m.by_class[classId] ?? m.by_class.riddare ?? { distance: 2.5, duration_s: 0.32 };
  return {
    distance: c.distance,
    duration_s: c.duration_s,
    iframes_s: m.iframes_s,
    cooldown_s: m.cooldown_s,
    shield: c.shield,
  };
}

export function canStartDodge(o: { playing: boolean; dodgeCd: number; dodgeRemain: number; atkT: number }): boolean {
  return o.playing && o.dodgeCd <= 0 && o.dodgeRemain <= 0 && o.atkT <= 0;
}
