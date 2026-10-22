import type { Anim, AnimSet } from './spriteAnim';
import { animBodyHeight, animSetRefHeight } from './spriteLayout';

/** Designreferens: riddare_idle ≈ 155 px synlig höjd vid 1,8 m. */
export const FIGURE_HEIGHT_HUMAN_M = 1.8;
export const SCREEN_PX_PER_WORLD_METER = 155 / FIGURE_HEIGHT_HUMAN_M;

export type FigureHeightProfile =
  | 'human'
  | 'wolf'
  | 'wolf_large'
  | 'bear'
  | 'deer'
  | 'fox'
  | 'hare'
  | 'dog_small'
  | 'spider'
  | 'ghost'
  | 'corrupted_human'
  | 'boss_bear'
  | 'boss_undead'
  | 'boss_wolf';

const PROFILE_HEIGHT_M: Record<FigureHeightProfile, number> = {
  human: FIGURE_HEIGHT_HUMAN_M,
  wolf: 0.8,
  wolf_large: 1.05,
  bear: 1.2,
  deer: 0.9,
  fox: 0.4,
  hare: 0.3,
  dog_small: 0.45,
  spider: 0.55,
  ghost: 1.65,
  corrupted_human: FIGURE_HEIGHT_HUMAN_M,
  boss_bear: 2.8,
  boss_undead: 2.4,
  boss_wolf: 1.25,
};

const MONSTER_PROFILE: Record<string, FigureHeightProfile> = {
  skogsvarg: 'wolf',
  skuggvarg: 'wolf',
  likatare_varg: 'wolf',
  vargbest: 'wolf_large',
  gravargsledare: 'boss_wolf',
  ruttbjorn: 'bear',
  grabjornen_ulvhild: 'boss_bear',
  taggsvin: 'deer',
  skelett_hund: 'dog_small',
  vandrande_skelett: 'human',
  skelett_krigare: 'human',
  skelett_bagskytt: 'human',
  skelett_runprast: 'human',
  skelett_vakt: 'human',
  skelett_kapten: 'human',
  benkungen_valdemar: 'boss_undead',
  skogsspindel: 'spider',
  gruvspindel: 'spider',
  smittad_bybo: 'corrupted_human',
  forvriden_jagare: 'corrupted_human',
  ruttnande_lik: 'corrupted_human',
  gravgast: 'ghost',
};

const FAMILY_PROFILE: Record<string, FigureHeightProfile> = {
  bestar: 'wolf',
  ododa: 'human',
  insekter: 'spider',
  forvridna: 'corrupted_human',
  gastar: 'ghost',
};

/** Animation för världshöjd (idle före walk — samma mått som stående NPC). */
export function referenceAnimForScale(set: AnimSet): Anim | undefined {
  return set.idle ?? set.gang ?? set.run ?? set.attack ?? set.dod;
}

/** Synlig kroppshöjd i skärmpx vid scaleK = 1 (inkl. anim.scale från ark). */
export function measuredSpriteBodyPx(set: AnimSet): number {
  const a = referenceAnimForScale(set);
  if (!a) return 1;
  return animBodyHeight(1, animSetRefHeight(set), a);
}

export function scaleKForWorldHeightM(set: AnimSet, heightM: number): number {
  const targetPx = heightM * SCREEN_PX_PER_WORLD_METER;
  return targetPx / measuredSpriteBodyPx(set);
}

export function displayedBodyPx(set: AnimSet, scaleK: number): number {
  const a = referenceAnimForScale(set);
  if (!a) return 0;
  return animBodyHeight(scaleK, animSetRefHeight(set), a);
}

export function displayedWorldHeightM(set: AnimSet, scaleK: number): number {
  return displayedBodyPx(set, scaleK) / SCREEN_PX_PER_WORLD_METER;
}

export function shadowRadiusForWorldHeightM(heightM: number): number {
  return 26 * (heightM / FIGURE_HEIGHT_HUMAN_M);
}

export function worldHeightMForHeroOrNpc(): number {
  return FIGURE_HEIGHT_HUMAN_M;
}

export function worldHeightMForMonster(id: string, family: string, boss = false): number {
  let profile = MONSTER_PROFILE[id] ?? FAMILY_PROFILE[family] ?? 'human';
  if (boss && profile === 'wolf') profile = 'wolf_large';
  if (boss && id === 'gravargsledare') profile = 'boss_wolf';
  if (boss && id === 'grabjornen_ulvhild') profile = 'boss_bear';
  if (boss && id === 'benkungen_valdemar') profile = 'boss_undead';
  return PROFILE_HEIGHT_M[profile];
}
