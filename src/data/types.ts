/** TS-interfaces för speldata (src/data/*.json, kopierat från Speldesigns /spel/design/). Bara fält som koden använder är typade strikt. */

export type Range = [number, number];
export type DamageType = 'hugg' | 'stick' | 'kross';

export interface MonsterDef {
  id: string;
  name: string;
  family: string;
  level: number;
  hp: number;
  /** Fast skada per träff (ingen slump, ingen skalning). */
  damage: number;
  defense: number;
  speed: number;
  attack_cd: number;
  xp: number;
  aggro_range: number;
  boss: boolean;
  behavior?: string;
  weapon_type?: string | null;
  knockback_resist?: number;
  design_source?: { from: string; ref_level: number };
}
export interface MonsterFamily {
  id: string;
  name: string;
  color: string;
  weak: DamageType[];
  resist: DamageType[];
  subtypes: string[];
  boss?: string;
}
export interface MonsterFamilies {
  damage_types: { id: DamageType; name: string }[];
  multiplier_rules: { svag: number; normal: number; resistent: number };
  families: MonsterFamily[];
  monsters: MonsterDef[];
}

export interface EnemyRow {
  enemy: string;
  weight: number;
  group?: Range;
}
export interface SpawnPoint {
  id: string;
  pos: [number, number];
  radius: number;
  groups?: Range;
  group_size?: Range;
  zone?: string;
  enemy_table?: EnemyRow[];
}
export interface SessionRoll {
  active_spawn_points?: Range;
  always_active?: string[];
  monsters_per_group?: Range;
  champions?: { chance_per_group: number; max: number };
  uniques?: { chance_per_game: number; max: number };
}
export interface SpawnArea {
  id: string;
  name: string;
  family: string;
  city_id: string | null;
  min_player_distance: number;
  center_safe_radius?: number;
  enemy_table?: EnemyRow[];
  zone_tables?: Record<string, EnemyRow[]>;
  spawn_points: SpawnPoint[];
  session_roll?: SessionRoll;
  boss?: { enemy: string; pos: [number, number]; zone?: string; level?: number };
}
export interface SpawnZones {
  areas: SpawnArea[];
}

export type EliteKind = 'champion' | 'unik' | 'minion';
export interface EliteModifier {
  id: string;
  effect: string;
}
export interface MonsterLevels {
  item_level: { cap: number; bonus: { boss: number } };
  elites: {
    champion: { level_bonus: number; hp_mult: number; damage_mult: number; defense_add: number; xp_mult: number; loot: EliteLoot };
    unik: {
      level_bonus: number;
      hp_mult: number;
      damage_mult: number;
      defense_add: number;
      xp_mult: number;
      modifiers_count: number | Range;
      minions: { count: Range; level_bonus: number; hp_mult: number; damage_mult: number };
      loot: EliteLoot;
    };
    modifiers: EliteModifier[];
    unique_names: string[];
  };
  xp_penalty: { table: { hjalte_minus_monster: number; xp_mult: number }[] };
}
export interface EliteLoot {
  extra_rolls: number;
  drop_chance: number;
  quality_mult: number;
  min_quality?: string;
  ilvl_bonus?: number;
}

export interface Skill {
  id: string;
  name: string;
  stamina_cost: number;
  cooldown_s: number;
  effect: string;
}
export interface HeroClass {
  id: string;
  name: string;
  role: string;
  main_damage_type: DamageType;
  base: { hp: number; stamina: number; damage: Range; defense: number; speed: number; crit_chance: number };
  skills: Skill[];
}
export interface Classes {
  meta: { crit_multiplier: number; max_level?: number };
  classes: HeroClass[];
}

export interface PortalGate {
  any_of: ({ city_cleared: string } | { hero_level_min: number })[];
}
export interface PortalVillage {
  portal: {
    trigger: { delay_s: number; gate?: PortalGate; sealed_state?: { message: string } };
    interaction_radius: number;
  };
  boss: { id?: string; hp: number; level: number; phases: { name: string; damage_mult?: number }[] };
  progression: { max_level: number };
}

export interface CityState {
  id: string;
  name: string;
}
export interface Cities {
  states: CityState[];
}

export interface Quality {
  id: string;
  name: string;
  color: string;
}
export interface Qualities {
  qualities: Quality[] | Record<string, Quality>;
}
