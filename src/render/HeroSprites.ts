import { Rectangle, Texture } from 'pixi.js';
import type { Anim, AnimSet } from './Assets';
import { assetUrl } from './Assets';

const HERO_SCALE = 0.55;

interface HeroSheetJson {
  image: string;
  frameW: number;
  frameH: number;
  anchor: [number, number];
  dirs: string[];
  frames?: number;
  fps?: number;
  loop?: boolean;
  hitFrame?: number;
  rects: { dir: string; frame?: number; x: number; y: number; w: number; h: number }[];
}

async function json<T>(p: string): Promise<T> {
  const r = await fetch(assetUrl(p));
  if (!r.ok) throw new Error(`Kunde inte ladda ${p}`);
  return (await r.json()) as T;
}

async function tex(p: string): Promise<Texture> {
  const { Assets: PixiAssets } = await import('pixi.js');
  return PixiAssets.load<Texture>(assetUrl(p));
}

function cut(src: Texture, x: number, y: number, w: number, h: number): Texture {
  return new Texture({ source: src.source, frame: new Rectangle(x, y, w, h) });
}

/** Bygger en 8-riktningsanimation från riddare_* JSON (idle, walk, run, attack). */
async function loadSheet(dir: string, name: string): Promise<Anim> {
  const rel = `${dir}/${name}.json`;
  const meta = await json<HeroSheetJson>(rel);
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
    scale: HERO_SCALE,
  };
}

function withFallbacks(set: AnimSet): AnimSet {
  const idle = set.idle;
  if (!idle) throw new Error('Hjältesprite saknar idle');
  const gang = set.gang ?? idle;
  return {
    idle,
    gang,
    run: set.run ?? gang,
    attack: set.attack ?? gang,
    dod: set.dod ?? idle,
  };
}

/** Laddar hjältesprites per klass; saknade klasser får riddarens ark med klass-tint i Game. */
export class HeroSprites {
  private readonly byClass = new Map<string, AnimSet>();
  private fallback: AnimSet | null = null;

  async load(): Promise<void> {
    const base = '2d/sprites/hero';
    const riddare: AnimSet = {
      idle: await loadSheet(base, 'riddare_idle_8dir'),
      gang: await loadSheet(base, 'riddare_walk_8dir'),
      run: await loadSheet(base, 'riddare_run_8dir'),
      attack: await loadSheet(base, 'riddare_attack_8dir'),
    };
    const full = withFallbacks(riddare);
    this.byClass.set('riddare', full);
    this.fallback = full;
  }

  /** Animationsark för klass; okända klasser faller tillbaka till riddaren. */
  setFor(cls: string): AnimSet {
    if (!this.fallback) throw new Error('Hjältesprites ej laddade');
    return this.byClass.get(cls) ?? this.fallback;
  }
}
