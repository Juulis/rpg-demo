import { Container } from 'pixi.js';
import type { Vec2 } from '../core/GameContext';
import { DirSprite } from '../render/DirSprite';
import type { AnimSet } from '../render/spriteAnim';
import type { WorldFigureId } from '../render/WorldFigureSprites';
import { Iso } from '../render/Iso';
import type { Zone } from '../world/Zone';

const BODY_R = 0.45;

function faceDir(dx: number, dy: number): number {
  const a = Math.atan2(dy, dx);
  return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}

/** Dekorativ världsfigur (patrullerar, ingen dialog). */
export class WorldAmbientEntity {
  readonly view = new Container();
  readonly id: string;
  readonly figure: WorldFigureId;
  readonly pos: Vec2;
  private readonly sprite: DirSprite;
  private target: Vec2;
  private wait = 0;
  private gestCd = 4;
  private gesting = false;
  private readonly isHandlare: boolean;
  private readonly canRun: boolean;

  constructor(id: string, figure: WorldFigureId, pos: Vec2, set: AnimSet) {
    this.id = id;
    this.figure = figure;
    this.pos = { x: pos.x, y: pos.y };
    this.target = { x: pos.x, y: pos.y };
    this.isHandlare = figure === 'handlare';
    this.canRun = figure === 'radjur';
    this.sprite = new DirSprite(set, 1, 20, false);
    this.sprite.play('idle');
    this.view.addChild(this.sprite);
    this.syncView();
  }

  update(dt: number, zone: Zone, rng: () => number): void {
    if (this.isHandlare) {
      this.gestCd -= dt;
      if (!this.gesting && this.gestCd <= 0 && this.sprite.hasAnim('attack')) {
        this.gestCd = 8 + rng() * 10;
        this.gesting = true;
        this.sprite.play('attack', true);
      }
      if (this.gesting && this.sprite.done) {
        this.gesting = false;
        this.sprite.play('idle');
      }
    }

    if (!this.gesting) {
      const dx = this.target.x - this.pos.x;
      const dy = this.target.y - this.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.25) {
        if (this.wait <= 0) {
          this.wait = 2 + rng() * 5;
          const lim = (zone.circle ?? 40) - 5;
          const a = rng() * Math.PI * 2;
          const d = (0.2 + rng() * 0.7) * lim;
          this.target = { x: Math.cos(a) * d, y: Math.sin(a) * d };
          zone.collide(this.target, BODY_R);
        }
        this.sprite.play('idle');
      } else {
        const speed = this.canRun && dist > 6 ? 2.8 : 1.6;
        const step = Math.min(dist, speed * dt);
        this.pos.x += (dx / dist) * step;
        this.pos.y += (dy / dist) * step;
        zone.collide(this.pos, BODY_R);
        this.sprite.dir = faceDir(dx, dy);
        this.sprite.play(this.canRun && dist > 6 ? 'run' : 'gang');
      }
    }

    this.wait -= dt;
    this.sprite.update(dt);
    this.syncView();
  }

  private syncView(): void {
    const p = Iso.worldToScreen(this.pos.x, this.pos.y);
    this.view.position.set(p.x, p.y);
    this.view.zIndex = this.pos.x + this.pos.y;
  }
}
