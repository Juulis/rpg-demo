import { Container, Graphics, Sprite } from 'pixi.js';
import type { ResolvedNpc } from '../npc/npcPlacement';
import type { Anim } from '../render/spriteAnim';
import { Iso } from '../render/Iso';

/** Statisk NPC-sprite i världen (ingen kollision, ingen skada). */
export class NpcEntity {
  readonly view = new Container();
  readonly resolved: ResolvedNpc;

  constructor(resolved: ResolvedNpc, anim: Anim | null) {
    this.resolved = resolved;
    if (anim?.frames[0]?.[0]) {
      const s = new Sprite(anim.frames[0][0]);
      s.anchor.set(anim.anchor[0] / anim.w, anim.anchor[1] / anim.h);
      this.view.addChild(s);
    } else {
      const g = new Graphics().ellipse(0, -24, 14, 22).fill({ color: 0x9a8a70, alpha: 0.9 });
      g.circle(0, -48, 10).fill(0xc4b59a);
      this.view.addChild(g);
    }
    const p = Iso.worldToScreen(resolved.pos.x, resolved.pos.y);
    this.view.position.set(p.x, p.y);
    this.view.zIndex = resolved.pos.x + resolved.pos.y;
  }
}
