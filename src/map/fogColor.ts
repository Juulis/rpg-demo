import type { Rgba } from './FogOfWar';
import { nightBlend } from '../world/GameClock';

/** Dimma på kartan: tätare och mörkare på natten. */
export function mapFogColor(clockTime: number, mini: boolean): Rgba {
  const b = nightBlend(clockTime);
  if (mini) {
    const base = [13, 15, 18, 255] as Rgba;
    return [
      Math.round(base[0] * (1 - b * 0.5)),
      Math.round(base[1] * (1 - b * 0.45)),
      Math.round(base[2] * (1 - b * 0.35)),
      Math.min(255, Math.round(base[3] + b * 40)),
    ];
  }
  const base = [11, 12, 14, 230] as Rgba;
  return [
    Math.round(base[0] * (1 - b * 0.55)),
    Math.round(base[1] * (1 - b * 0.5)),
    Math.round(base[2] * (1 - b * 0.4)),
    Math.min(255, Math.round(base[3] + b * 25)),
  ];
}
