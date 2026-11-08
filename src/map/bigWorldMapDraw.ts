import { chunkCenterWorld, chunkMinWorld, chunkWorldSpan, worldToChunk } from '../world/bigWorld/bigWorldCoords';
import { chunkDistanceFromStart, ringAtChunkDistance } from '../world/bigWorld/ringZone';
import { getBigWorldCatalog } from '../world/bigWorld/worldGenerator';
import type { Projection } from './MapPainter';

const RING_FILL: readonly string[] = ['#3a5040', '#425848', '#4a6048', '#526850', '#5a7050', '#627850', '#6a8050', '#728850'];

const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

function outCode(x: number, y: number, x0: number, y0: number, x1: number, y1: number): number {
  let c = INSIDE;
  if (x < x0) c |= LEFT;
  else if (x > x1) c |= RIGHT;
  if (y < y0) c |= BOTTOM;
  else if (y > y1) c |= TOP;
  return c;
}

/** Cohen–Sutherland. Returnerar null om segmentet ligger helt utanför rektangeln. */
function clipSegment(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { ax: number; ay: number; bx: number; by: number } | null {
  let c0 = outCode(ax, ay, x0, y0, x1, y1);
  let c1 = outCode(bx, by, x0, y0, x1, y1);
  for (let i = 0; i < 8; i++) {
    if ((c0 | c1) === 0) return { ax, ay, bx, by };
    if ((c0 & c1) !== 0) return null;
    const c = c0 !== 0 ? c0 : c1;
    let x: number;
    let y: number;
    if (c & TOP) {
      x = ax + ((bx - ax) * (y1 - ay)) / (by - ay);
      y = y1;
    } else if (c & BOTTOM) {
      x = ax + ((bx - ax) * (y0 - ay)) / (by - ay);
      y = y0;
    } else if (c & RIGHT) {
      y = ay + ((by - ay) * (x1 - ax)) / (bx - ax);
      x = x1;
    } else {
      y = ay + ((by - ay) * (x0 - ax)) / (bx - ax);
      x = x0;
    }
    if (c === c0) {
      ax = x;
      ay = y;
      c0 = outCode(ax, ay, x0, y0, x1, y1);
    } else {
      bx = x;
      by = y;
      c1 = outCode(bx, by, x0, y0, x1, y1);
    }
  }
  return { ax, ay, bx, by };
}

function ringColor(ring: number): string {
  const idx = Math.min(ring, RING_FILL.length - 1);
  return RING_FILL[idx] ?? '#243028';
}

/** Chunk-rutnät, regionprickar och vägar för stor skog (minikarta / Tab-karta). */
export function drawBigWorldMapLayer(
  c: CanvasRenderingContext2D,
  heroWx: number,
  heroWy: number,
  p: Projection,
  opts: { chunkRadius: number; showLabels: boolean; isRevealed?: (wx: number, wy: number) => boolean },
): void {
  const catalog = getBigWorldCatalog();
  const span = chunkWorldSpan();
  const start = catalog.startChunk;
  const ringar = catalog.data.meta.zonmodell?.ringar ?? [];
  const heroChunk = worldToChunk(heroWx, heroWy);
  const X = (x: number): number => p.ox + x * p.s;
  const Y = (y: number): number => p.oy + y * p.s;
  const r = opts.chunkRadius;

  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      const cx = heroChunk.cx + dx;
      const cy = heroChunk.cy + dy;
      const dist = chunkDistanceFromStart(cx, cy, start);
      const { ring } = ringAtChunkDistance(dist, ringar);
      const min = chunkMinWorld(cx, cy);
      const cxw = min.x + span * 0.5;
      const cyw = min.y + span * 0.5;
      if (opts.isRevealed && !opts.isRevealed(cxw, cyw)) continue;
      c.fillStyle = ringColor(ring);
      c.fillRect(X(min.x), Y(min.y), span * p.s, span * p.s);
      c.strokeStyle = '#1a1e18';
      c.lineWidth = 0.5;
      c.strokeRect(X(min.x), Y(min.y), span * p.s, span * p.s);
    }
  }

  for (const region of catalog.data.regioner) {
    const [rcx, rcy] = region.chunk;
    if (Math.abs(rcx - heroChunk.cx) > r + 2 || Math.abs(rcy - heroChunk.cy) > r + 2) continue;
    const center = chunkCenterWorld(rcx, rcy);
    if (opts.isRevealed && !opts.isRevealed(center.x, center.y)) continue;
    c.fillStyle = region.sakert ? '#f2c46b' : '#9fc4d4';
    c.beginPath();
    c.arc(X(center.x), Y(center.y), Math.max(2, 3 * p.s), 0, 7);
    c.fill();
    if (opts.showLabels && !p.mini) {
      c.fillStyle = '#c8d8e0';
      c.font = '11px Cinzel, Georgia, serif';
      c.textAlign = 'center';
      c.fillText(region.namn ?? region.id, X(center.x), Y(center.y) - 10);
    }
  }

  c.strokeStyle = '#6a7a60';
  c.lineWidth = Math.max(1, p.s * 0.4);
  for (const road of catalog.data.vagar) {
    const pts: { x: number; y: number }[] = [];
    for (const id of road.strackning) {
      const reg = catalog.regionById.get(id);
      if (!reg) continue;
      const c0 = chunkCenterWorld(reg.chunk[0], reg.chunk[1]);
      if (Math.abs(reg.chunk[0] - heroChunk.cx) > r + 3 || Math.abs(reg.chunk[1] - heroChunk.cy) > r + 3) continue;
      pts.push(c0);
    }
    if (pts.length < 2) continue;
    const first = pts[0];
    if (!first) continue;
    const firstReg = catalog.regionById.get(road.strackning[0] ?? '');
    const revealWx = firstReg ? chunkMinWorld(firstReg.chunk[0], firstReg.chunk[1]).x : first.x;
    const revealWy = firstReg ? chunkMinWorld(firstReg.chunk[0], firstReg.chunk[1]).y : first.y;
    if (opts.isRevealed && !opts.isRevealed(revealWx, revealWy)) continue;
    const clip =
      p.clipX0 != null && p.clipY0 != null && p.clipX1 != null && p.clipY1 != null
        ? { x0: p.clipX0, y0: p.clipY0, x1: p.clipX1, y1: p.clipY1 }
        : null;
    if (!clip) {
      c.beginPath();
      c.moveTo(X(first.x), Y(first.y));
      for (let i = 1; i < pts.length; i++) {
        const pt = pts[i];
        if (pt) c.lineTo(X(pt.x), Y(pt.y));
      }
      c.stroke();
      continue;
    }
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      if (!a || !b) continue;
      const seg = clipSegment(a.x, a.y, b.x, b.y, clip.x0, clip.y0, clip.x1, clip.y1);
      if (!seg) continue;
      c.beginPath();
      c.moveTo(X(seg.ax), Y(seg.ay));
      c.lineTo(X(seg.bx), Y(seg.by));
      c.stroke();
    }
  }

  const startCenter = chunkCenterWorld(start[0], start[1]);
  c.fillStyle = '#f2c46b88';
  c.beginPath();
  c.arc(X(startCenter.x), Y(startCenter.y), Math.max(3, 4 * p.s), 0, 7);
  c.fill();
}

/** Tab-karta: fönster runt hjälten i chunk-enheter. */
export function bigWorldMapBounds(heroWx: number, heroWy: number, chunkRadius = 6): readonly [number, number, number, number] {
  const span = chunkWorldSpan();
  const pad = chunkRadius * span;
  return [heroWx - pad, heroWy - pad, heroWx + pad, heroWy + pad];
}
