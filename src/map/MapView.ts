import type { HeroState, ZoneView } from '../core/GameContext';
import { mapFogColor } from './fogColor';
import type { GoalTracker } from './GoalTracker';
import type { MapModel } from './MapModel';
import type { MapPainter } from './MapPainter';

/** Stor överlagrad karta (Tab). */
export class MapView {
  readonly canvas: HTMLCanvasElement;
  private lastDrawKey = '';
  private lastZone = '';

  constructor(
    private readonly painter: MapPainter,
    private readonly model: MapModel,
    private readonly goals: GoalTracker,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'karta';
    Object.assign(this.canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '4',
      display: 'none',
      pointerEvents: 'none',
    });
  }

  setVisible(v: boolean): void {
    this.canvas.style.display = v ? 'block' : 'none';
    if (v) this.lastDrawKey = '';
  }

  draw(z: ZoneView, h: Readonly<HeroState>, time: number, clockTime = 0): void {
    if (z.name !== this.lastZone) {
      this.lastZone = z.name;
      this.lastDrawKey = '';
    }
    if (z.bigWorldStreaming) {
      const W = this.canvas.clientWidth;
      const H = this.canvas.clientHeight;
      const key = `${z.name}|${Math.round(h.pos.x / 16)}|${Math.round(h.pos.y / 16)}|${W}x${H}|${this.painter.fogDirty()}`;
      if (key === this.lastDrawKey) return;
      this.lastDrawKey = key;
    }
    const prep = this.painter.prepare(this.canvas);
    if (!prep) return;
    const { c, W, H } = prep;
    c.fillStyle = '#0d0f12d9';
    c.fillRect(0, 0, W, H);
    const [x0, y0, x1, y1] = this.model.bounds(z, h);
    const pad = 70;
    const s = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2 - 40) / (y1 - y0));
    const anchor = z.bigWorldStreaming ? this.painter.fogAnchor() : { x: 0, y: 0 };
    const p = {
      s,
      ox: W / 2 - ((x0 + x1) / 2) * s,
      oy: H / 2 + 20 - ((y0 + y1) / 2) * s,
      mini: false,
      fogOriginX: anchor.x,
      fogOriginY: anchor.y,
      clipX0: x0,
      clipY0: y0,
      clipX1: x1,
      clipY1: y1,
    };
    c.save();
    c.beginPath();
    c.rect(pad, pad, W - pad * 2, H - pad * 2 - 40);
    c.clip();
    this.painter.world(c, z, p, mapFogColor(clockTime, false), h);
    const g = this.goals.goal(z, h.pos);
    if (g) this.painter.goalRing(c, g, p, 0.5 + 0.5 * Math.sin(time / 250));
    this.painter.hero(c, h, p);
    c.restore();
    c.textAlign = 'center';
    c.fillStyle = '#e8d8c8';
    c.font = '700 30px Cinzel, Georgia, serif';
    c.shadowColor = '#c0182a88';
    c.shadowBlur = 14;
    c.fillText(this.model.zoneName(z), W / 2, 36);
    c.shadowBlur = 0;
    c.fillStyle = '#9fc4d4';
    c.font = '13px Cinzel, Georgia, serif';
    c.fillText(this.model.t('map.legend'), W / 2, H - 28);
  }
}
