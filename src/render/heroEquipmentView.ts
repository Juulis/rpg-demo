import type { Equip } from '../logic/loot/types';
import type { Loot } from '../logic/loot/Loot';
import type { KnightEquipmentSprites } from './KnightEquipmentSprites';
import {
  type AnimDrawOrders,
  equipmentActiveLayers,
  equipmentHasShield,
  type UtrustningLayer,
  weaponVisualFromType,
  type WeaponVisual,
} from './heroEquipment';
import type { Anim, AnimName } from './spriteAnim';

/** Tillstånd för paper-doll-rendering i DirSprite. */
export interface HeroEquipmentViewState {
  layersByAnim: Partial<Record<AnimName, Partial<Record<UtrustningLayer, Anim>>>>;
  drawOrdersByAnim: Partial<Record<AnimName, AnimDrawOrders>>;
  weaponVisual: WeaponVisual;
  activeLayers: ReadonlySet<UtrustningLayer>;
}

export function buildHeroEquipmentView(
  heroClass: string,
  doll: KnightEquipmentSprites,
  equip: Equip,
  loot: Loot,
): HeroEquipmentViewState | null {
  if (heroClass !== 'riddare' || !doll.isReady) return null;

  const weapon = equip.vapen;
  const weaponType = weapon ? loot.base(weapon).weapon_type : null;
  const weaponVisual = weaponVisualFromType(weaponType);
  const off = equip.offhand;
  const offType = off ? loot.base(off).weapon_type : null;
  const hasShield = equipmentHasShield(offType);
  const activeLayers = equipmentActiveLayers(equip, hasShield, weaponVisual);

  return {
    layersByAnim: doll.layerAnims,
    drawOrdersByAnim: doll.drawOrders,
    weaponVisual,
    activeLayers,
  };
}
