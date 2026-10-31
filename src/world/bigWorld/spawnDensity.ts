/** Monster per chunk enligt spel/design/varldsgenerator.json tathet_per_chunk. */
export function mellanmarkSpawnCountRange(ring: number): readonly [number, number] {
  if (ring <= 0) return [8, 12];
  if (ring === 1) return [10, 14];
  if (ring === 2) return [12, 16];
  return [12, 18];
}

/** Inom 4 rutor från väg: högst hälften av normal täthet (varldsgenerator vaggar_spawn). */
export function applyRoadSpawnFactor(count: number, onRoad: boolean): number {
  if (!onRoad || count <= 0) return count;
  return Math.max(1, Math.floor(count * 0.5));
}
