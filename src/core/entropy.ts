import { Rng } from './Rng';

/**
 * Slumpkällor utan Math.random (förbjudet av ESLint). Seeds för nytt game och id:n kommer från
 * Web Crypto (crypto.getRandomValues) i plattformslagret och injiceras i spar-logiken; all
 * spelslump går via en seedad Rng.
 */
export type RandomFn = () => number;
export type SeedSource = () => number;

/** 31-bitars seed (≠ 0) från crypto.getRandomValues. */
export const cryptoSeed: SeedSource = () => {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return (a[0] ?? 1) >>> 1 || 1;
};

/** RandomFn från en seedad Rng (mulberry32). */
export const seededRandom = (seed: number): RandomFn => {
  const r = new Rng(seed);
  return () => r.next();
};
