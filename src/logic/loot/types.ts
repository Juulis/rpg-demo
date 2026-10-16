/** Typer för lootdata (foremal_bas, affix, set, drop_tabeller, loot_kvaliteter, attribut). Lösa men typade. */
export type Num2 = [number, number];
export type Dict<T> = Record<string, T>;

export interface BaseItem {
  id: string;
  name: string;
  category: string;
  weapon_type?: string;
  slot?: string;
  weight?: string;
  tier?: number;
  damage?: Num2;
  attack_speed?: number;
  range?: number;
  damage_type?: string;
  two_handed?: boolean;
  defense?: number;
  block_chance?: number;
  move_penalty?: number;
  stamina_regen_penalty?: number;
  max_hp_bonus?: number;
  speed_bonus?: number;
  requirements?: { level?: number };
  item_level?: number;
  stack?: number;
  subtype?: string;
  heal?: number;
  heal_pct?: number;
  stamina?: number;
  stamina_pct?: number;
  potion_slots?: number;
  size?: Num2;
}
export interface Legendary {
  id: string;
  name: string;
  base: string;
  level?: number;
  item_level?: number;
  fixed: Dict<number | string>;
}
export interface SetPiece {
  id: string;
  name: string;
  base: string;
  fixed?: Dict<number | string>;
}
export interface SetDef {
  id: string;
  name: string;
  class?: string;
  level?: number;
  item_level?: number;
  pieces: SetPiece[];
  bonuses: Dict<Dict<unknown>>;
}
export interface AffixTier {
  tier: number;
  min_ilvl: number;
  value: Num2;
}
export interface AffixDef {
  id: string;
  name: string;
  kind: 'prefix' | 'suffix';
  stat: string;
  slots: string[];
  tiers: AffixTier[];
}
export interface QualityDef {
  id: string;
  name: string;
  color: string;
  base_chance: number;
  affixes: { prefix: Num2; suffix: Num2; total: Num2 };
}
export interface FamilyTable {
  drop_chance: number;
  gold_mult: number;
  gold_chance: number;
  category_weights: Dict<number>;
  extra?: { item: string; chance: number }[];
}
export interface MonsterDrop {
  family: string;
  monster_level: number | Num2;
  table?: string;
  weapon_drop?: { chance: number; weapon_type: string };
  shield_drop?: { chance: number };
  drop_chance_override?: number;
  table_override?: { category_weights?: Dict<number> };
}
export interface BossDrop extends MonsterDrop {
  drops: Num2;
  quality_bonus?: Dict<number>;
  guaranteed?: { item: string; count: number }[];
  gold_mult: number;
  first_kill_bonus?: { min_quality: string; count: number };
  named_drops?: { legendary?: string; set?: string; chance: number }[];
}

export interface Affix {
  id: string;
  name: string;
  kind: string;
  stat: string;
  value: number;
  tier: number;
}
/** Ett föremål (sparformat kompatibelt med legacy: rk_inv_<klass>). x/y = plats i väskan. */
export interface Item {
  uid: string;
  base: string;
  quality: string;
  affixes: Affix[];
  ilvl: number;
  seed?: number | undefined;
  set?: string;
  leg?: string;
  rareName?: string;
  n?: number;
  x?: number;
  y?: number;
}
export type Drop = { item: Item; gold?: undefined } | { gold: number; item?: undefined };

export const SLOTS = ['hjalm', 'amulett', 'brost', 'vapen', 'offhand', 'handskar', 'balte', 'stovlar', 'ring1', 'ring2'] as const;
export type Slot = (typeof SLOTS)[number];
export type Equip = Partial<Record<Slot, Item | null>>;
