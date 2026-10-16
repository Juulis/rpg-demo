import { Container, Graphics, Sprite } from 'pixi.js';
import type { Anim, AnimName, AnimSet } from './Assets';

/** Animerad 8-riktningsfigur med skugga. Fotpunkt = containerns origo. */
export class DirSprite extends Container {
  readonly sprite = new Sprite();
  private readonly shadow = new Graphics();
  private anim: AnimName = 'idle';
  private t = 0;
  dir = 0;
  done = false;

  constructor(
    private readonly set: AnimSet,
    private readonly scaleK: number,
    shadowR: number,
    private readonly mirrorSingle = true,
  ) {
    super();
    this.shadow.ellipse(0, 0, shadowR, shadowR / 2).fill({ color: 0x000000, alpha: 0.35 });
    this.addChild(this.shadow, this.sprite);
    this.apply();
  }

  play(name: AnimName, restart = false): void {
    let n: AnimName = name;
    if (!this.set[n]) {
      if (n === 'run') n = this.set.gang ? 'gang' : 'idle';
      else n = this.set.idle ? 'idle' : 'gang';
    }
    if (n === this.anim && !restart) return;
    this.anim = n;
    this.t = 0;
    this.done = false;
  }

  update(dt: number): void {
    this.t += dt;
    this.apply();
  }

  /** Visuell höjd i px (för etiketter och träffytor). */
  get height2(): number {
    const a = this.cur();
    return a ? a.anchor[1] * this.scaleK * (a.scale ?? 1) : 60;
  }

  private cur(): Anim | undefined {
    return this.set[this.anim] ?? this.set.idle ?? this.set.gang ?? this.set.run;
  }

  /** Aktuell animation (för träffsynk). */
  currentAnim(): Anim | undefined {
    return this.cur();
  }

  hasAnim(name: AnimName): boolean {
    return !!this.set[name];
  }

  getAnim(name: AnimName): Anim | undefined {
    return this.set[name];
  }

  private apply(): void {
    const a = this.cur();
    if (!a) return;
    const single = !!a.single;
    const row = a.frames[single ? 0 : this.dir] ?? a.frames[0];
    if (!row) return;
    let f = Math.floor(this.t * a.fps);
    if (a.loop) f %= row.length;
    else if (f >= row.length) {
      f = row.length - 1;
      this.done = true;
    }
    const tex = row[f];
    if (tex) this.sprite.texture = tex;
    // En enda SV-bild speglas för östliga riktningar (NO, O, SO) och N.
    const mirror = single && this.mirrorSingle && this.dir >= 4;
    this.sprite.anchor.set(a.anchor[0] / a.w, a.anchor[1] / a.h);
    const k = this.scaleK * (a.scale ?? 1);
    this.sprite.scale.set(mirror ? -k : k, k);
  }
}
