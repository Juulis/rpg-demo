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

/**
 * Vilket spriteark ett monster ritas med (bara utseende). Har monstret ett eget ark (index.json) används det i 1:1
 * (arken är ritade i skala mot riddaren). Annars lånas ett närliggande ark med färgton.
 */
export function monsterLook(id: string, family: string, has: (sheet: string) => boolean): { sheet: string; scale: number; tint: number } {
  if (has(id)) return { sheet: id, scale: 1, tint: 0xffffff };
  const alias: Record<string, [string, number?]> = {
    skelett_hund: ['skuggvarg', 0xd8d0b8],
    skelett_bagskytt: ['skelett_krigare', 0xd8d0c0],
    skelett_runprast: ['skelett_krigare', 0xe0a0a0],
    skelett_vakt: ['skelett_krigare', 0xb8bcc8],
    gruvspindel: ['skogsspindel'],
    vargbest: ['likatare_varg'],
    gravargsledare: ['skuggvarg'],
    sprickvasen: ['smittad_bybo', 0xc8a882],
    lyktgast: ['gravgast', 0xaaccff],
    klockdrunknad: ['ruttnande_lik', 0x8899aa],
    havsgast: ['gravgast', 0x6688aa],
  };
  const a = alias[id];
  if (a && has(a[0])) return { sheet: a[0], scale: 1, tint: a[1] ?? 0xffffff };
  const byFam: Record<string, string> = {
    bestar: 'skogsvarg',
    ododa: 'vandrande_skelett',
    insekter: 'skogsspindel',
    forvridna: 'smittad_bybo',
    gastar: 'gravgast',
  };
  return { sheet: byFam[family] ?? 'forvriden_jagare', scale: 1, tint: 0xffffff };
}
