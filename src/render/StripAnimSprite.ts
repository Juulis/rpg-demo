import { Container, Sprite } from 'pixi.js';
import type { Anim } from './spriteAnim';

/** Enkel loop-animation (en rad med frames, ingen riktning). */
export class StripAnimSprite extends Container {
  readonly sprite = new Sprite();
  private t = 0;

  constructor(
    private readonly anim: Anim,
    scaleK: number,
  ) {
    super();
    this.addChild(this.sprite);
    const a = anim;
    this.sprite.anchor.set(a.anchor[0] / a.w, a.anchor[1] / a.h);
    this.sprite.scale.set(scaleK * (a.scale ?? 1));
    this.apply();
  }

  update(dt: number): void {
    this.t += dt;
    this.apply();
  }

  private apply(): void {
    const row = this.anim.frames[0];
    if (!row?.length) return;
    let f = Math.floor(this.t * this.anim.fps);
    if (this.anim.loop) f %= row.length;
    else f = Math.min(f, row.length - 1);
    const tex = row[f];
    if (tex) this.sprite.texture = tex;
  }
}
