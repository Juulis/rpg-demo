import { DATA, monsterDef } from '../data';
import type { DamageType, MonsterDef } from '../data/types';

export interface MonsterAttack {
  id: string;
  damage?: number;
  cd?: number;
  range?: number;
  arc_deg?: number;
  projectile_speed?: number;
  radius?: number;
  telegraph_s?: number;
  summon?: Record<string, number>;
}
export interface BossPhase {
  name: string;
  speed?: number;
  damage_mult?: number;
  attacks: MonsterAttack[];
}
/** Sammanslagen monsterdefinition: monsterfamiljer.json (stats) + portal_by.json (räckvidd, attacker, boss). */
export interface FullMonsterDef extends MonsterDef {
  attack_range: number;
  attacks: MonsterAttack[];
  /** Beteende ärvs från källtypen (design_source.from). */
  ai: string;
  weak: DamageType[];
  resist: DamageType[];
  phases?: BossPhase[];
}

interface PbEnemy {
  id: string;
  attack_range?: number;
  attacks?: MonsterAttack[];
}
const PB = DATA.portalVillage as unknown as {
  enemies: PbEnemy[];
  boss: {
    id: string;
    name: string;
    hp: number;
    defense: number;
    speed: number;
    aggro_range: number;
    xp: number;
    level: number;
    phases: BossPhase[];
  };
};

const cache = new Map<string, FullMonsterDef>();

/** Hämtar sammanslagen definition. Bossens skada kommer enbart ur fasernas attacker (ingen fallback). */
export function fullDef(id: string): FullMonsterDef {
  const hit = cache.get(id);
  if (hit) return hit;
  const m = monsterDef(id);
  const from = m.design_source?.from ?? id;
  const pb = PB.enemies.find((e) => e.id === id) ?? PB.enemies.find((e) => e.id === from);
  const fam = DATA.families.families.find((f) => f.id === m.family);
  const def: FullMonsterDef = {
    ...m,
    attack_range: pb?.attack_range ?? 1.8,
    attacks: pb?.attacks ?? [],
    ai: from,
    weak: fam?.weak ?? [],
    resist: fam?.resist ?? [],
  };
  if (id === PB.boss.id) {
    Object.assign(def, {
      hp: PB.boss.hp,
      defense: PB.boss.defense,
      speed: PB.boss.speed,
      aggro_range: PB.boss.aggro_range,
      xp: PB.boss.xp,
      level: PB.boss.level,
      boss: true,
    });
    def.phases = PB.boss.phases;
    def.attack_range = def.phases[0]?.attacks.find((a) => a.id === 'liehugg')?.range ?? def.attack_range;
  }
  cache.set(id, def);
  return def;
}

/** Vilket spriteark ett monster ritas med, och skala/färgton (bara utseende). */
export function monsterLook(id: string, family: string): { sheet: string; scale: number; tint: number } {
  const own: Record<string, [string, number, number?]> = {
    skogsvarg: ['skogsvarg', 0.75],
    vargbest: ['vargbest', 0.62],
    taggsvin: ['taggsvin', 0.7],
    skuggvarg: ['skuggvarg', 0.75],
    gravargsledare: ['gravargsledare', 0.62],
    skelett_kapten: ['skelett_kapten', 0.62],
    askriddare: ['askriddare', 0.62],
    skelett_hund: ['skuggvarg', 0.65, 0xd8d0b8],
    skelett_krigare: ['vandrande_skelett', 0.75],
    skelett_bagskytt: ['vandrande_skelett', 0.72, 0xd8d0c0],
    skelett_runprast: ['vandrande_skelett', 0.74, 0xe0a0a0],
    skelett_vakt: ['vandrande_skelett', 0.85, 0xb8bcc8],
    benkungen_valdemar: ['vandrande_skelett', 1.15, 0xf0d890],
    gruvspindel: ['skogsspindel', 0.7],
  };
  const o = own[id];
  if (o) return { sheet: o[0], scale: o[1], tint: o[2] ?? 0xffffff };
  const byFam: Record<string, string> = { bestar: 'skogsvarg', ododa: 'vandrande_skelett', insekter: 'skogsspindel' };
  return { sheet: byFam[family] ?? 'forvriden_jagare', scale: 0.75, tint: 0xffffff };
}
