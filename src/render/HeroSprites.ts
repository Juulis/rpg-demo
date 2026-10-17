import { Rectangle, Texture } from 'pixi.js';
import type { Anim, AnimSet } from './spriteAnim';
import { assetUrl } from './spriteAnim';

const HERO_SCALE = 0.55;

interface HeroSheetJson {
  image: string;
  imageWebp?: string;
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

type TexLoader = (url: string) => Promise<Texture>;

async function json<T>(p: string): Promise<T> {
  const r = await fetch(assetUrl(p));
  if (!r.ok) throw new Error(`Kunde inte ladda ${p}`);
  return (await r.json()) as T;
}

function cut(src: Texture, x: number, y: number, w: number, h: number): Texture {
  return new Texture({ source: src.source, frame: new Rectangle(x, y, w, h) });
}

async function loadImage(tex: TexLoader, dir: string, meta: HeroSheetJson): Promise<Texture> {
  const names = [meta.imageWebp, meta.image].filter((n): n is string => !!n);
  for (const file of names) {
    try {
      return await tex(`${dir}/${file}`);
    } catch {
      /* prova nästa format */
    }
  }
  throw new Error(`Kunde inte ladda bild för ${meta.image}`);
}

/** Bygger en 8-riktningsanimation från riddare_* JSON. */
async function loadSheet(tex: TexLoader, dir: string, name: string): Promise<Anim> {
  const meta = await json<HeroSheetJson>(`${dir}/${name}.json`);
  const src = await loadImage(tex, dir, meta);
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
    scale: HERO_SCALE,
  };
}

function withFallbacks(set: AnimSet): AnimSet | null {
  const gang = set.gang ?? set.run ?? set.attack ?? set.idle;
  const idle = set.idle ?? gang;
  if (!idle) return null;
  return {
    idle,
    gang,
    run: set.run ?? gang,
    attack: set.attack ?? gang,
    dod: set.dod ?? idle,
  };
}

async function emergencySet(tex: TexLoader): Promise<AnimSet> {
  const t = await tex('2d/tiles/gras_1.png');
  const stub: Anim = {
    frames: Array.from({ length: 8 }, () => [t]),
    anchor: [16, 32],
    w: 32,
    h: 32,
    fps: 1,
    loop: true,
    scale: 1,
  };
  return { idle: stub, gang: stub, run: stub, attack: stub, dod: stub };
}

/** Laddar hjältesprites per klass; saknade klasser får riddarens ark med klass-tint i Game. */
export class HeroSprites {
  private readonly byClass = new Map<string, AnimSet>();
  private fallback: AnimSet | null = null;

  async load(tex: TexLoader): Promise<void> {
    const base = '2d/sprites/hero';
    const trySheet = async (id: string): Promise<Anim | undefined> => {
      try {
        return await loadSheet(tex, base, id);
      } catch (e) {
        console.warn(`[HeroSprites] kunde inte ladda ${id}:`, e);
        return undefined;
      }
    };
    const riddare: AnimSet = {
      idle: await trySheet('riddare_idle_8dir'),
      gang: await trySheet('riddare_walk_8dir'),
      run: await trySheet('riddare_run_8dir'),
      attack: await trySheet('riddare_attack_8dir'),
    };
    const full = withFallbacks(riddare) ?? (await emergencySet(tex));
    this.byClass.set('riddare', full);
    this.fallback = full;
  }

  setFor(cls: string): AnimSet {
    if (!this.fallback) throw new Error('Hjältesprites ej laddade');
    return this.byClass.get(cls) ?? this.fallback;
  }
}
