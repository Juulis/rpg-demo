import { Rectangle, Texture } from 'pixi.js';
import type { Anim, AnimSet } from './spriteAnim';
import { assetUrl, DIRS } from './spriteAnim';

export type TexLoader = (url: string) => Promise<Texture>;

export interface Sheet8Json {
  image: string;
  frameW: number;
  frameH: number;
  anchor: [number, number];
  dirs: string[];
  frames?: number;
  fps?: number;
  loop?: boolean;
  hitFrame?: number;
  alignX?: number[][];
  alignY?: number[][];
  rects: { dir: string; frame?: number; x: number; y: number; w: number; h: number }[];
}

export interface StripAnimJson {
  image: string;
  frames: number;
  frameW: number;
  frameH: number;
  anchor: [number, number];
  fps?: number;
  loop?: boolean;
}

function cut(src: Texture, x: number, y: number, w: number, h: number): Texture {
  return new Texture({ source: src.source, frame: new Rectangle(x, y, w, h) });
}

async function json<T>(p: string): Promise<T> {
  const r = await fetch(assetUrl(p));
  if (!r.ok) throw new Error(`Kunde inte ladda ${p}`);
  return (await r.json()) as T;
}

/** 8-riktningsark (riddare_*, monster_*_8dir, npc_*_idle_8dir). */
export async function loadSheet8dir(tex: TexLoader, dir: string, name: string, scale?: number): Promise<Anim> {
  const meta = await json<Sheet8Json>(`${dir}/${name}.json`);
  const src = await tex(`${dir}/${meta.image}`);
  const nDir = meta.dirs.length;
  const nFrame = meta.frames ?? 1;
  const frames: Texture[][] = [];
  for (let d = 0; d < nDir; d++) {
    const row: Texture[] = [];
    for (let f = 0; f < nFrame; f++) {
      const rect = meta.rects.find((r) => meta.dirs.indexOf(r.dir) === d && (r.frame ?? 0) === f);
      if (!rect) throw new Error(`${name}: saknar ruta ${meta.dirs[d]} f${f}`);
      row.push(cut(src, rect.x, rect.y, rect.w, rect.h));
    }
    frames.push(row);
  }
  return {
    frames,
    anchor: meta.anchor,
    w: meta.frameW,
    h: meta.frameH,
    fps: meta.fps ?? 1,
    loop: meta.loop ?? true,
    hitFrame: meta.hitFrame,
    alignX: meta.alignX,
    alignY: meta.alignY,
    scale,
  };
}

/** En horisontell bildrad (t.ex. lägereld). */
export async function loadStripAnim(tex: TexLoader, dir: string, name: string): Promise<Anim> {
  const meta = await json<StripAnimJson>(`${dir}/${name}.json`);
  const src = await tex(`${dir}/${meta.image}`);
  const row: Texture[] = [];
  for (let c = 0; c < meta.frames; c++) row.push(cut(src, c * meta.frameW, 0, meta.frameW, meta.frameH));
  return {
    frames: DIRS.map(() => row),
    anchor: meta.anchor,
    w: meta.frameW,
    h: meta.frameH,
    fps: meta.fps ?? 10,
    loop: meta.loop ?? true,
    single: true,
  };
}

/** Försök ladda monster-ark i hero-8dir-format; null om idle saknas. */
export async function loadMonster8dirSet(tex: TexLoader, id: string): Promise<Partial<AnimSet> | null> {
  const dir = `2d/sprites/monster/${id}`;
  const load = async (stem: string): Promise<Anim | undefined> => {
    try {
      return await loadSheet8dir(tex, dir, `${id}_${stem}_8dir`);
    } catch {
      return undefined;
    }
  };
  const idle = await load('idle');
  if (!idle) return null;
  const set: Partial<AnimSet> = { idle };
  const walk = await load('walk');
  if (walk) set.gang = walk;
  const attack = await load('attack');
  if (attack) set.attack = attack;
  const death = await load('death');
  if (death) set.dod = { ...death, loop: false };
  return set;
}
