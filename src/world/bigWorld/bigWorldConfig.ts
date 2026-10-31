/** Issue #85 del 2: chunk-streaming kring hjälten (varld_stor + ChunkWorldCache). */
export const BIG_WORLD_STREAMING_ENABLED = true;

export const BIG_WORLD_CACHE_KEEP_RADIUS = 3;

/**
 * Generatorregler och framtida utökningar: spel/design/varldsgenerator.json (+ varld_stor.json, bana1_stor.json).
 * Runtime läser fortfarande src/data/varld_stor.json; synkas separat från design.
 * world_seed per sparfil = session.seed i Game (geografi + chunk-spawns tills game/world-seed delas).
 */
export const BIG_WORLD_DESIGN_REFS = [
  'spel/design/varldsgenerator.json',
  'spel/design/varld_stor.json',
  'spel/design/bana1_stor.json',
] as const;
