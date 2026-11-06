import type { HeroState, ZoneView } from '../core/GameContext';
import { mapFogColor } from './fogColor';
import type { GoalTracker } from './GoalTracker';
import type { MapPainter } from './MapPainter';

/** Rund minikarta centrerad på hjälten; målet visas som prick eller som pil vid kanten. */
export class MiniMapView {
  static readonly VIEW = 26;
  readonly canvas: HTMLCanvasElement;

  constructor(
    private readonly painter: MapPainter,
    private readonly goals: GoalTracker,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'minikarta';
    Object.assign(this.canvas.style, {
      position: 'fixed',
      top: '150px',
      right: '16px',
      width: '150px',
      height: '150px',
      zIndex: '3',
      display: 'none',
      pointerEvents: 'none',
      border: '1px solid #4a6a7a',
      borderRadius: '8px',
      background: '#0d0f12cc',
    });
  }

  setVisible(v: boolean): void {
    this.canvas.style.display = v ? 'block' : 'none';
  }

  draw(z: ZoneView, h: Readonly<HeroState>, time: number, clockTime = 0): void {
    const prep = this.painter.prepare(this.canvas);
    if (!prep) return;
    const { c, W, H } = prep;
    const s = Math.min(W, H) / (MiniMapView.VIEW * 2);
    const anchor = z.bigWorldStreaming ? this.painter.fogAnchor() : { x: 0, y: 0 };
    const p = {
      s,
      ox: W / 2 - h.pos.x * s,
      oy: H / 2 - h.pos.y * s,
      mini: true,
      fogOriginX: anchor.x,
      fogOriginY: anchor.y,
    };
    const pulse = 0.5 + 0.5 * Math.sin(time / 250);
    c.save();
    c.beginPath();
    c.arc(W / 2, H / 2, W / 2 - 2, 0, 7);
    c.clip();
    this.painter.world(c, z, p, mapFogColor(clockTime, true), h);
    this.painter.hero(c, h, p);
    c.restore();
    const g = this.goals.goal(z, h.pos);
    if (g) {
      const dx = (g.x - h.pos.x) * s;
      const dy = (g.y - h.pos.y) * s;
      const rr = W / 2 - 7;
      const d = Math.hypot(dx, dy);
      c.fillStyle = '#f2c46b';
      c.strokeStyle = '#000';
      c.lineWidth = 1;
      c.beginPath();
      if (d < rr) {
        c.arc(W / 2 + dx, H / 2 + dy, 3.5 + pulse, 0, 7);
      } else {
        const ux = dx / d;
        const uy = dy / d;
        const ex = W / 2 + ux * rr;
        const ey = H / 2 + uy * rr;
        c.moveTo(ex + ux * 6, ey + uy * 6);
        c.lineTo(ex - ux * 4 - uy * 5, ey - uy * 4 + ux * 5);
        c.lineTo(ex - ux * 4 + uy * 5, ey - uy * 4 - ux * 5);
        c.closePath();
      }
      c.fill();
      c.stroke();
    }
    c.strokeStyle = '#4a6a7a';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(W / 2, H / 2, W / 2 - 2, 0, 7);
    c.stroke();
    c.fillStyle = '#9fc4d4';
    c.font = '10px Cinzel, Georgia, serif';
    c.textAlign = 'center';
    c.fillText('N', W / 2, 11);
  }
}
