import type { Anim, AnimSet } from './spriteAnim';
import { loadSheet8dir, type TexLoader } from './sheet8dir';

const HERO_SCALE = 0.55;

/** NV/NO i run-arket är profil — använd walk-rader, snabbare fps i run. */
function patchRunDiagonals(run: Anim, walk: Anim): void {
  for (const d of [3, 5]) {
    if (walk.frames[d]?.length) run.frames[d] = walk.frames[d];
    if (walk.alignX?.[d]) {
      run.alignX ??= walk.alignX.map((row) => [...row]);
      run.alignY ??= walk.alignY?.map((row) => [...row]) ?? [];
      run.alignX[d] = [...walk.alignX[d]];
      if (walk.alignY?.[d]) run.alignY[d] = [...walk.alignY[d]];
    }
  }
}

function withFallbacks(set: AnimSet): AnimSet | null {
  const gang = set.gang ?? set.run ?? set.attack ?? set.idle;
  const idle = set.idle ?? gang;
  if (!idle) return null;
  return {
    idle,
    gang,
    run: set.run ?? gang,
    attack: set.attack ?? gang,
    dod: set.dod ?? idle,
  };
}

async function emergencySet(tex: TexLoader): Promise<AnimSet> {
  const t = await tex('2d/tiles/gras_1.png');
  const stub: Anim = {
    frames: Array.from({ length: 8 }, () => [t]),
    anchor: [16, 32],
    w: 32,
    h: 32,
    fps: 1,
    loop: true,
    scale: 1,
  };
  return { idle: stub, gang: stub, run: stub, attack: stub, dod: stub };
}

/** Laddar hjältesprites per klass; saknade klasser får riddarens ark med klass-tint i Game. */
export class HeroSprites {
  private readonly byClass = new Map<string, AnimSet>();
  private fallback: AnimSet | null = null;

  async load(tex: TexLoader): Promise<void> {
    const base = '2d/sprites/hero';
    const trySheet = async (id: string): Promise<Anim | undefined> => {
      try {
        return await loadSheet8dir(tex, base, id, HERO_SCALE);
      } catch (e) {
        console.warn(`[HeroSprites] kunde inte ladda ${id}:`, e);
        return undefined;
      }
    };
    const walk = await trySheet('riddare_walk_8dir');
    const run = await trySheet('riddare_run_8dir');
    if (run && walk) patchRunDiagonals(run, walk);
    const riddare: AnimSet = {
      idle: await trySheet('riddare_idle_8dir'),
      gang: walk,
      run,
      attack: await trySheet('riddare_attack_8dir'),
      dod: await trySheet('riddare_dodge_8dir'),
    };
    const full = withFallbacks(riddare) ?? (await emergencySet(tex));
    this.byClass.set('riddare', full);
    this.fallback = full;
  }

  setFor(cls: string): AnimSet {
    if (!this.fallback) throw new Error('Hjältesprites ej laddade');
    return this.byClass.get(cls) ?? this.fallback;
  }
}
