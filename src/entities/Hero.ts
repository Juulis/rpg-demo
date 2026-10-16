import type { HeroState } from '../core/GameContext';
import { HeroModel } from '../logic/HeroModel';
import type { Loot } from '../logic/loot/Loot';
import type { DirSprite } from '../render/DirSprite';

/** Hjälten i klienten: ren HeroModel (logik) + figur. */
export class Hero extends HeroModel {
  constructor(
    s: HeroState,
    L: Loot,
    public view: DirSprite,
  ) {
    super(s, L);
  }
}
