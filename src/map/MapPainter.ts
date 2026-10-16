import type { HeroState, ZoneView } from '../core/GameContext';
import { FogOfWar, type Rgba } from './FogOfWar';
import type { Goal } from './GoalTracker';
import type { MapModel } from './MapModel';

/** Världs- till skärmtransform för en ritning. */
export interface Projection {
  s: number;
  ox: number;
  oy: number;
  mini: boolean;
}

const FONT = '13px Cinzel, Georgia, serif';

/** Gemensam ritlogik för stor karta och minikarta (terräng, hinder, fog, runor, portaler, spelare). */
export class MapPainter {
  constructor(
    private readonly model: MapModel,
    /** Hämtar aktuell hjältes fog (byts vid hero_loaded). */
    private readonly fog: () => FogOfWar,
  ) {}

  /** Anpassar canvasens upplösning efter CSS-storlek och DPR; returnerar context och CSS-mått. */
  prepare(cv: HTMLCanvasElement): { c: CanvasRenderingContext2D; W: number; H: number } | null {
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth;
    const H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const c = cv.getContext('2d');
    if (!c) return null;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    return { c, W, H };
  }

  world(c: CanvasRenderingContext2D, z: ZoneView, p: Projection, fogColor: Rgba): void {
    const X = (x: number): number => p.ox + x * p.s;
    const Y = (y: number): number => p.oy + y * p.s;
    const s = p.s;
    if (z.circle) {
      c.fillStyle = '#1f2a1f';
      c.beginPath();
      c.arc(X(0), Y(0), z.circle * s, 0, 7);
      c.fill();
      c.strokeStyle = '#3d4430';
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = '#2a3526';
      c.beginPath();
      c.arc(X(0), Y(0), 12 * s, 0, 7);
      c.fill();
    }
    if (z.rect) {
      const [a, b] = z.rect;
      c.fillStyle = '#2b2e2c';
      c.fillRect(X(a), Y(a), (b - a) * s, (b - a) * s);
      c.strokeStyle = '#4a4e54';
      c.lineWidth = 2;
      c.strokeRect(X(a), Y(a), (b - a) * s, (b - a) * s);
      c.fillStyle = '#383c40';
      c.fillRect(X(-1), Y(-24), 4 * s, 54 * s);
      c.fillRect(X(-25), Y(2.5), 50 * s, 3 * s);
      for (const q of this.model.villageZones()) {
        const [ax, ay] = this.model.tileToWorld(...q.tiles[0]);
        const [bx, by] = this.model.tileToWorld(...q.tiles[1]);
        c.strokeStyle = q.boss_arena ? '#c0182a99' : q.safe ? '#f2c46b88' : '#4a6a7a88';
        c.setLineDash([4, 4]);
        c.lineWidth = 1;
        c.strokeRect(X(ax - 1), Y(ay - 1), (bx - ax + 2) * s, (by - ay + 2) * s);
        c.setLineDash([]);
        if (!p.mini) {
          const done = !!z.cleared[q.id];
          c.fillStyle = done ? '#9fc4d4' : '#8a8f96';
          c.font = FONT;
          c.textAlign = 'center';
          c.fillText(this.model.areaName(q.id) + (done ? ' ✓' : ''), X((ax + bx) / 2), Y(ay) + 14);
        }
      }
    }
    for (const k of z.colliders) {
      if (k.off) continue;
      c.fillStyle = k.r > 1.4 ? '#5a5650' : '#14201a';
      c.beginPath();
      c.arc(X(k.x), Y(k.y), Math.max(1, k.r * s), 0, 7);
      c.fill();
    }
    const { GRID, CELL, HALF } = FogOfWar;
    const img = this.fog().grid(z.name).image(GRID, fogColor);
    if (img) {
      c.imageSmoothingEnabled = true;
      c.drawImage(img, X(-HALF), Y(-HALF), GRID * CELL * s, GRID * CELL * s);
    }
    // runstenar och portaler syns alltid, oavsett fog
    for (const r of z.runes) {
      c.fillStyle = r.active ? '#7fb8d8' : '#50565e';
      c.strokeStyle = '#9fd0e8';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(X(r.x), Y(r.y) - 7);
      c.lineTo(X(r.x) + 5, Y(r.y));
      c.lineTo(X(r.x), Y(r.y) + 7);
      c.lineTo(X(r.x) - 5, Y(r.y));
      c.closePath();
      c.fill();
      c.stroke();
    }
    for (const pt of z.portals) {
      c.strokeStyle = '#ff3344';
      c.fillStyle = '#c0182a88';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(X(pt.x), Y(pt.y), Math.max(5, 1.4 * s), 0, 7);
      c.fill();
      c.stroke();
      if (!p.mini) {
        c.fillStyle = '#ff7080';
        c.font = FONT;
        c.textAlign = 'center';
        c.fillText(pt.target === 'village' ? 'Portal → Den gamla byn' : 'Portal → Skogen', X(pt.x), Y(pt.y) - Math.max(9, 1.4 * s + 6));
      }
    }
  }

  goalRing(c: CanvasRenderingContext2D, g: Goal, p: Projection, pulse: number): void {
    const x = p.ox + g.x * p.s;
    const y = p.oy + g.y * p.s;
    c.strokeStyle = '#f2c46b';
    c.lineWidth = 2;
    c.globalAlpha = 0.6 + 0.4 * pulse;
    c.beginPath();
    c.arc(x, y, 12 + 4 * pulse, 0, 7);
    c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = '#f2c46b';
    c.font = FONT;
    c.textAlign = 'center';
    c.fillText(g.text, x, y + 30);
  }

  /** Spelarpil; framåt = (sin, cos) av facing. */
  hero(c: CanvasRenderingContext2D, h: HeroState, p: Projection): void {
    const fx = Math.sin(h.facing);
    const fy = Math.cos(h.facing);
    const sz = p.mini ? 7 : 10;
    const X = p.ox + h.pos.x * p.s;
    const Y = p.oy + h.pos.y * p.s;
    c.fillStyle = '#f2c46b';
    c.strokeStyle = '#000';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(X + fx * sz, Y + fy * sz);
    c.lineTo(X - fx * sz * 0.6 + fy * sz * 0.6, Y - fy * sz * 0.6 - fx * sz * 0.6);
    c.lineTo(X - fx * sz * 0.6 - fy * sz * 0.6, Y - fy * sz * 0.6 + fx * sz * 0.6);
    c.closePath();
    c.fill();
    c.stroke();
  }
}
