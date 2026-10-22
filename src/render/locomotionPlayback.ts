import type { Anim } from './spriteAnim';

/** Gångcykeln är kalibrerad vid riddarens basfart (12 bildrutor @ 18 fps). */
export const WALK_CALIB_SPEED = 5.2;

/** Animationshastighet så stegen håller takten med faktisk förflyttning (minskar fotglidning). */
export function locomotionPlaybackRate(anim: Anim | undefined, speedWorldPerSec: number, refSpeed = WALK_CALIB_SPEED): number {
  if (!anim?.loop || anim.fps <= 0) return 1;
  const row = anim.frames[0];
  if (!row?.length) return 1;
  const rate = speedWorldPerSec / refSpeed;
  return Math.max(0.55, Math.min(1.65, rate));
}
