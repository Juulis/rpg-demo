/** Issue #85 del 2: chunk-streaming kring hjälten (varld_stor + ChunkWorldCache). */
export const BIG_WORLD_STREAMING_ENABLED = true;

/** Chunkdata hålls laddad (Chebyshev) — större än render så avlastning inte fladdrar. */
export const BIG_WORLD_CACHE_KEEP_RADIUS = 3;

/** Synlig mark bakas inom denna radie (Chebyshev). ~5×5 chunkar ≈ main skala. */
export const BIG_WORLD_RENDER_RADIUS = 2;

/** Max ms tile-bygge per bildruta innan vi fortsätter nästa frame. */
export const BIG_WORLD_GROUND_BUILD_BUDGET_MS = 4;

/**
 * Generatorregler: spel/design/varldsgenerator.json (+ varld_stor.json, bana1_stor.json).
 * world_seed = session.worldSeed (geografi), game_seed = session.seed (chunk-spawns m.m.).
 */
export const BIG_WORLD_DESIGN_REFS = [
  'spel/design/varldsgenerator.json',
  'spel/design/varld_stor.json',
  'spel/design/bana1_stor.json',
] as const;

/** Stor värld utan hård ytterkant (design meta.ytterkant saknar implementation — obegränsad värld). */
export const BIG_WORLD_UNBOUNDED = true;
