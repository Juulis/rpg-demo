import type { Container } from 'pixi.js';
import type { Vec2 } from '../core/GameContext';
import { Iso } from './Iso';

/** Följer en punkt mjukt och översätter mellan skärm och värld. */
export class Camera {
  readonly pos: Vec2 = { x: 0, y: 0 };
  zoom = 0.8;
  private w = 0;
  private h = 0;

  constructor(private readonly world: Container) {}

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.zoom = Math.max(0.6, Math.min(1, Math.min(w, h * 1.6) / 1400));
  }

  snap(p: Vec2): void {
    this.pos.x = p.x;
    this.pos.y = p.y;
    this.apply();
  }

  follow(p: Vec2, dt: number): void {
    const k = Math.min(1, dt * 6);
    this.pos.x += (p.x - this.pos.x) * k;
    this.pos.y += (p.y - this.pos.y) * k;
    this.apply();
  }

  /** Skärm-px → värld. */
  toWorld(sx: number, sy: number): Vec2 {
    return Iso.screenToWorld((sx - this.world.position.x) / this.zoom, (sy - this.world.position.y) / this.zoom);
  }

  /** Värld (+ höjd i px ovanför marken) → skärm-px. */
  toScreen(x: number, y: number, lift = 0): Vec2 {
    const s = Iso.worldToScreen(x, y);
    return { x: this.world.position.x + s.x * this.zoom, y: this.world.position.y + (s.y - lift) * this.zoom };
  }

  private apply(): void {
    const s = Iso.worldToScreen(this.pos.x, this.pos.y);
    this.world.scale.set(this.zoom);
    this.world.position.set(Math.round(this.w / 2 - s.x * this.zoom), Math.round(this.h / 2 - s.y * this.zoom));
  }
}
