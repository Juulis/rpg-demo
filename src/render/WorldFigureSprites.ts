import type { Anim, AnimSet } from './spriteAnim';
import { loadSheet8dir, type TexLoader } from './sheet8dir';

const WORLD_SCALE = 0.8;

export const WORLD_HUMAN_FIGURES = ['jagare', 'aventyrare', 'varld_vakt', 'handlare'] as const;
export const WORLD_ANIMAL_FIGURES = ['bjorn', 'radjur'] as const;
export type WorldHumanFigure = (typeof WORLD_HUMAN_FIGURES)[number];
export type WorldAnimalFigure = (typeof WORLD_ANIMAL_FIGURES)[number];
export type WorldFigureId = WorldHumanFigure | WorldAnimalFigure;

function complete(partial: AnimSet): AnimSet | null {
  const gang = partial.gang ?? partial.run ?? partial.idle;
  const idle = partial.idle ?? gang;
  if (!idle || !gang) return null;
  return {
    idle,
    gang,
    run: partial.run ?? gang,
    attack: partial.attack ?? gang,
    dod: partial.dod ?? idle,
  };
}

/** 8-dir figurer under sprites/varld/<id>/ (jägare, handlare med gest, djur). */
export class WorldFigureSprites {
  private readonly byId = new Map<WorldFigureId, AnimSet>();

  async load(tex: TexLoader): Promise<void> {
    const tryAnim = async (id: WorldFigureId, anim: string): Promise<Anim | undefined> => {
      const base = `2d/sprites/varld/${id}`;
      try {
        return await loadSheet8dir(tex, base, `${id}_${anim}_8dir`, WORLD_SCALE);
      } catch (e) {
        console.warn(`[WorldFigureSprites] ${id}_${anim}:`, e);
        return undefined;
      }
    };

    for (const id of WORLD_HUMAN_FIGURES) {
      const walk = await tryAnim(id, 'walk');
      const idle = await tryAnim(id, 'idle');
      if (id === 'handlare') {
        const gest = await tryAnim(id, 'gest');
        const set = complete({ idle, gang: walk, attack: gest });
        if (set) this.byId.set(id, set);
        continue;
      }
      const attack = await tryAnim(id, 'attack');
      const set = complete({ idle, gang: walk, attack });
      if (set) this.byId.set(id, set);
    }

    for (const id of WORLD_ANIMAL_FIGURES) {
      const walk = await tryAnim(id, 'walk');
      const idle = await tryAnim(id, 'idle');
      const run = id === 'radjur' ? await tryAnim(id, 'run') : undefined;
      const attack = await tryAnim(id, 'attack');
      const set = complete({ idle, gang: walk, run: run ?? walk, attack });
      if (set) this.byId.set(id, set);
    }
  }

  get(id: WorldFigureId): AnimSet | undefined {
    return this.byId.get(id);
  }
}
