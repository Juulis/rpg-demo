import { chunkCenterWorld, chunkMinWorld, chunkWorldSpan, worldToChunk } from '../world/bigWorld/bigWorldCoords';
import { chunkDistanceFromStart, ringAtChunkDistance } from '../world/bigWorld/ringZone';
import { getBigWorldCatalog } from '../world/bigWorld/worldGenerator';
import type { Projection } from './MapPainter';

const RING_FILL: readonly string[] = ['#243028', '#2a3828', '#303820', '#383820', '#403018', '#482818', '#502020', '#581818'];

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
    if (opts.isRevealed && !opts.isRevealed(first.x, first.y)) continue;
    c.beginPath();
    c.moveTo(X(first.x), Y(first.y));
    for (let i = 1; i < pts.length; i++) {
      const pt = pts[i];
      if (pt) c.lineTo(X(pt.x), Y(pt.y));
    }
    c.stroke();
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
