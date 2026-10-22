import { Container, Graphics } from 'pixi.js';
import type { ResolvedNpc } from '../npc/npcPlacement';
import { DirSprite } from '../render/DirSprite';
import { Iso } from '../render/Iso';
import type { Anim, AnimSet } from '../render/spriteAnim';

const NPC_FACE_DIR = 1; // SV

/** Statisk NPC-sprite i världen (ingen kollision, ingen skada). */
export class NpcEntity {
  readonly view = new Container();
  readonly resolved: ResolvedNpc;
  private readonly sprite: DirSprite | null = null;

  constructor(resolved: ResolvedNpc, anim: Anim | null) {
    this.resolved = resolved;
    if (anim && !anim.single) {
      const set: AnimSet = { idle: anim, gang: anim };
      const v = new DirSprite(set, 1, 22, false);
      v.dir = NPC_FACE_DIR;
      v.play('idle');
      this.sprite = v;
      this.view.addChild(v);
    } else if (anim?.frames[0]?.[0]) {
      const v = new DirSprite({ idle: anim, gang: anim }, 1, 22, true);
      v.dir = NPC_FACE_DIR;
      v.play('idle');
      this.sprite = v;
      this.view.addChild(v);
    } else {
      const g = new Graphics().ellipse(0, -24, 14, 22).fill({ color: 0x9a8a70, alpha: 0.9 });
      g.circle(0, -48, 10).fill(0xc4b59a);
      this.view.addChild(g);
    }
    const p = Iso.worldToScreen(resolved.pos.x, resolved.pos.y);
    this.view.position.set(p.x, p.y);
    this.view.zIndex = resolved.pos.x + resolved.pos.y;
  }

  update(dt: number): void {
    this.sprite?.update(dt);
  }
}
