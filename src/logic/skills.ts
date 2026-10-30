import type { HeroClass, Skill } from '../data/types';

export type SkillSlot = 0 | 1 | 2 | 3;

export function isPassiveSkill(sk: Skill): boolean {
  return sk.type === 'passiv';
}

/** Första fyra aktiva färdigheter i klassordning (passiv hoppas över). */
export function barActiveSkills(cls: HeroClass): Skill[] {
  return cls.skills.filter((s) => !isPassiveSkill(s)).slice(0, 4);
}

export function passiveSkills(cls: HeroClass): Skill[] {
  return cls.skills.filter((s) => isPassiveSkill(s));
}

export function skillUnlocked(sk: Skill, heroLevel: number): boolean {
  const need = sk.unlock_level ?? 1;
  return heroLevel >= need;
}

export function canUseSkill(o: { sk: Skill; heroLevel: number; cooldownLeft: number; stamina: number; down?: boolean }): boolean {
  if (!skillUnlocked(o.sk, o.heroLevel)) return false;
  if (o.sk.id === 'skoldblock') return o.down !== undefined;
  if (o.down === false) return false;
  if (o.cooldownLeft > 0) return false;
  if (o.sk.stamina_cost > o.stamina) return false;
  return true;
}

export function skillCooldownKey(id: string): string {
  return id;
}
