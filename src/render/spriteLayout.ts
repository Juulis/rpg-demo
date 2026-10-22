import type { Anim, AnimSet } from './spriteAnim';

/** Referenshöjd (px) för enhetlig skala — walk först, annars idle/run. */
export function animSetRefHeight(set: AnimSet): number {
  const ref = set.gang ?? set.idle ?? set.run ?? set.attack ?? set.dod;
  return ref?.h ?? 256;
}

/** Pixi-skala så att alla animationer i setet får samma logiska storlek (fotankare oförändrad). */
export function animDisplayScale(scaleK: number, refH: number, anim: Anim): number {
  return scaleK * (anim.scale ?? 1) * (refH / anim.h);
}

/** Synlig höjd ovanför fotpunkten (px) vid dir 0, frame 0. */
export function animBodyHeight(scaleK: number, refH: number, anim: Anim, dir = 0, frame = 0): number {
  const k = animDisplayScale(scaleK, refH, anim);
  const ay = anim.alignY?.[anim.single ? 0 : dir]?.[frame] ?? 0;
  return (anim.h - anim.anchor[1] + ay) * k;
}
