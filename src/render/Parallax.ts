import { Container, Sprite, type Texture } from 'pixi.js';
import type { Vec2 } from '../core/GameContext';

/** Fast himmel + fjärran lager som rör sig långsamt med kameran (syns i kanterna bortom marken). */
export class Parallax {
  private readonly sky = new Sprite();
  private readonly far = new Sprite();
  private w = 0;
  private h = 0;

  constructor(layer: Container) {
    layer.addChild(this.sky, this.far);
  }

  set(sky: Texture | undefined, far: Texture | undefined): void {
    if (sky) this.sky.texture = sky;
    if (far) this.far.texture = far;
    this.layout();
  }

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.layout();
  }

  update(cam: Vec2): void {
    const k = Math.max(this.w / 1280, this.h / 720) * 1.15;
    this.far.scale.set(k);
    this.far.position.set((this.w - 1280 * k) / 2 - (cam.x - cam.y) * 2, (this.h - 720 * k) / 2 - (cam.x + cam.y) * 0.8);
  }

  private layout(): void {
    const k = Math.max(this.w / 1280, this.h / 720);
    this.sky.scale.set(k);
    this.sky.position.set((this.w - 1280 * k) / 2, (this.h - 720 * k) / 2);
  }
}
