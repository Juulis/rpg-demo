import type { Anim, AnimSet } from './spriteAnim';

/** Walk-rutans pixelhöjd (kalibrering av världsskala — inte innehållsnormalisering). */
export function animSetRefHeight(set: AnimSet): number {
  const ref = set.gang ?? set.run ?? set.idle ?? set.attack ?? set.dod;
  return ref?.h ?? 256;
}

/** Pixi-skala: samma källpixel → samma skärmpixel i alla animationer (walk-referens vid scaleK). */
export function animDisplayScale(scaleK: number, _refH: number, anim: Anim): number {
  return scaleK * (anim.scale ?? 1);
}

/** Synlig höjd från fotpunkt till topp av rutan (px) — samma mått som DirSprite.height2. */
export function animBodyHeight(scaleK: number, refH: number, anim: Anim, dir = 0, frame = 0): number {
  const k = animDisplayScale(scaleK, refH, anim);
  const ay = anim.alignY?.[anim.single ? 0 : dir]?.[frame] ?? 0;
  return (anim.anchor[1] + ay) * k;
}
