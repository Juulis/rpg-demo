import type { Equip } from '../logic/loot/types';
import type { AnimName } from './spriteAnim';
import { DIRS } from './spriteAnim';

export type UtrustningLayer = 'svard_bak' | 'bas' | 'rustning' | 'hjalm' | 'skold' | 'svard_fram' | 'yxa_bak' | 'yxa_fram';

export type WeaponVisualKey = 'svard' | 'yxa';

export type WeaponVisual = WeaponVisualKey | null;

/** JSON-nyckel i riddare_utrustning.json → AnimName i spelet. */
export const UTRUSTNING_ANIM_TO_GAME: Record<string, AnimName> = {
  idle: 'idle',
  walk: 'gang',
  run: 'run',
  attack: 'attack',
  dodge: 'dod',
};

export const GAME_ANIM_TO_UTRUSTNING: Record<AnimName, string> = {
  idle: 'idle',
  gang: 'walk',
  run: 'run',
  attack: 'attack',
  dod: 'dodge',
};

const WEAPON_LAYER_SUFFIX = new Set(['svard_bak', 'svard_fram', 'yxa_bak', 'yxa_fram']);

/** Vapenlager som finns i asset-paketet (yxa + svärd). */
export function weaponVisualFromType(weaponType: string | null | undefined): WeaponVisual {
  if (!weaponType || weaponType === 'skold') return null;
  if (weaponType === 'yxa') return 'yxa';
  if (weaponType === 'bage') return null;
  return 'svard';
}

export function equipmentHasShield(offhandWeaponType: string | null | undefined): boolean {
  return offhandWeaponType === 'skold';
}

/** Vilka lager ska ritas givet equip (riddare-paper-doll). */
export function equipmentActiveLayers(equip: Equip, hasShield: boolean, weaponVisual: WeaponVisual): ReadonlySet<UtrustningLayer> {
  const active = new Set<UtrustningLayer>(['bas']);
  if (equip.brost) active.add('rustning');
  if (equip.hjalm) active.add('hjalm');
  if (hasShield) active.add('skold');
  if (weaponVisual === 'svard') {
    active.add('svard_bak');
    active.add('svard_fram');
  } else if (weaponVisual === 'yxa') {
    active.add('yxa_bak');
    active.add('yxa_fram');
  }
  return active;
}

export type AnimDrawOrders = Record<WeaponVisualKey, Record<string, readonly string[]>>;

/** Rå ordningslista per riktning, filtrerad till aktiva lager. */
export function equipmentDrawOrder(
  orderPerVapen: AnimDrawOrders,
  weaponVisual: WeaponVisual,
  dirIndex: number,
  active: ReadonlySet<string>,
): readonly string[] {
  const key: WeaponVisualKey = weaponVisual ?? 'svard';
  const dir = DIRS[dirIndex] ?? 'S';
  const raw = orderPerVapen[key][dir] ?? orderPerVapen[key].S ?? [];
  return raw.filter((layer) => active.has(layer));
}

/** Ordning utan vapen: samma lista som svärd men utan vapenlager. */
export function equipmentDrawOrderUnarmed(orderPerVapen: AnimDrawOrders, dirIndex: number, active: ReadonlySet<string>): readonly string[] {
  const dir = DIRS[dirIndex] ?? 'S';
  const raw = orderPerVapen.svard[dir] ?? orderPerVapen.svard.S ?? [];
  return raw.filter((layer) => active.has(layer) && !WEAPON_LAYER_SUFFIX.has(layer));
}
