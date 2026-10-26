import type { Dict, SetDef } from './types';

/** Bonustyper utöver numeriska affix-stat som set.json kan innehålla. */
export const SET_BONUS_SPECIAL_KEYS = new Set(['skill_bonus', 'immune_knockback', 'magic_unlock_preview']);

const NUMERIC_AFFIX_STATS = new Set([
  'damage_pct',
  'damage_flat',
  'attack_rating',
  'defense_pct',
  'defense',
  'block_chance',
  'magic_find',
  'lifesteal',
  'vs_demoner_damage_pct',
  'vs_ododa_damage_pct',
  'vs_bestar_damage_pct',
  'life',
  'stamina',
  'stamina_regen_pct',
  'attack_speed_pct',
  'move_speed_pct',
  'strong_hit_chance',
  'bleed_dps',
  'thorns',
  'gold_find',
  'life_regen',
  'crit_chance',
  'damage_reduction_flat',
  'life_on_hit',
  'range_bonus',
  'resist_dark_magic',
  'max_hp_bonus',
  'speed_bonus',
  'life_pct',
  'stamina_pct',
]);

export interface MergedSetBonuses {
  immuneKnockback: boolean;
  resistDarkMagic: number;
  skillBonus: Dict<Dict<unknown>>;
}

export function emptyMergedSetBonuses(): MergedSetBonuses {
  return { immuneKnockback: false, resistDarkMagic: 0, skillBonus: {} };
}

/** Slår ihop aktiva setbonusar (efter klassfilter) till spelbara fält. */
export function mergeSetBonusEntry(merged: MergedSetBonuses, bk: string, bv: unknown): void {
  if (bk === 'immune_knockback' && bv === true) {
    merged.immuneKnockback = true;
    return;
  }
  if (bk === 'skill_bonus' && bv && typeof bv === 'object') {
    for (const [sk, mods] of Object.entries(bv as Dict<unknown>)) {
      const prev = merged.skillBonus[sk] ?? {};
      merged.skillBonus[sk] = { ...prev, ...(mods as Dict<unknown>) };
    }
    return;
  }
  if (bk === 'resist_dark_magic' && typeof bv === 'number') {
    merged.resistDarkMagic += bv;
  }
}

export function validateSetBonusDefinitions(sets: SetDef[]): string[] {
  const issues: string[] = [];
  for (const s of sets) {
    for (const [tier, bon] of Object.entries(s.bonuses)) {
      for (const bk of Object.keys(bon)) {
        if (SET_BONUS_SPECIAL_KEYS.has(bk)) continue;
        if (NUMERIC_AFFIX_STATS.has(bk)) continue;
        if (bk === 'note') continue;
        issues.push(`set ${s.id} bonus ${tier}: okänd bonustyp "${bk}"`);
      }
    }
  }
  return issues;
}
