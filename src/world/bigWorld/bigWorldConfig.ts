/** Issue #85 del 2: chunk-streaming kring hjälten (varld_stor + ChunkWorldCache). */
export const BIG_WORLD_STREAMING_ENABLED = true;

/** Chunkdata hålls laddad (Chebyshev) — större än render så avlastning inte fladdrar. */
export const BIG_WORLD_CACHE_KEEP_RADIUS = 3;

/** Synlig mark bakas inom denna radie (Chebyshev). ~5×5 chunkar ≈ main skala. */
export const BIG_WORLD_RENDER_RADIUS = 2;

/** Max ms tile-bygge per bildruta innan vi fortsätter nästa frame. */
export const BIG_WORLD_GROUND_BUILD_BUDGET_MS = 4;

/** Rutor per bakad delpatch (64×64 chunk → 4×4 patchar à 16×16). */
export const BIG_WORLD_GROUND_PATCH_TILES = 16;

/** Upplösning på bakade marktexturer (0.5 ≈ halv pixeldensitet, håller RT under några MB). */
export const BIG_WORLD_GROUND_BAKE_SCALE = 0.5;

/** Max antal patch-bakningar per bildruta (undviker multi-sekunders spikes). */
export const BIG_WORLD_GROUND_MAX_BAKES_PER_FRAME = 1;

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

/** Bakgrundsfärg i Renderer.init — pixelprov ska skilja sig från mark. */
export const BIG_WORLD_SKY_CLEAR_COLOR = 0x0d0f12;
