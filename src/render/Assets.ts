import { Assets as PixiAssets, Rectangle, Texture } from 'pixi.js';
import { HeroSprites } from './HeroSprites';
import { assetUrl, DIRS, type Anim, type AnimName, type AnimSet } from './spriteAnim';

export { assetUrl, DIRS, type Anim, type AnimName, type AnimSet };

interface SheetAnim {
  file: string;
  frames: number;
  frameW: number;
  frameH: number;
  anchor: [number, number];
  fps: number;
  loop?: boolean;
}
interface Size {
  w: number;
  h: number;
  anchor: [number, number];
}

export const TILES = [
  'gras_1',
  'gras_2',
  'gras_3',
  'gras_4',
  'lera_1',
  'lera_2',
  'lera_3',
  'kullersten',
  'kullersten_mossig',
  'skogsbotten_lov',
  'skogsbotten_ormbunke',
  'gras_till_lera',
] as const;
export const DECOR = ['dod_ek', 'gran', 'stubbe', 'ormbunkar', 'runsten', 'stenhog', 'ruinmur', 'rod_portal'] as const;
export type DecorId = (typeof DECOR)[number];

async function json<T>(p: string): Promise<T> {
  const r = await fetch(assetUrl(p));
  if (!r.ok) throw new Error(`Kunde inte ladda ${p}`);
  return (await r.json()) as T;
}
const tex = (p: string): Promise<Texture> => PixiAssets.load<Texture>(assetUrl(p));
function cut(src: Texture, x: number, y: number, w: number, h: number): Texture {
  return new Texture({ source: src.source, frame: new Rectangle(x, y, w, h) });
}
function sheet(src: Texture, a: SheetAnim, rows = 8): Anim {
  const frames: Texture[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Texture[] = [];
    for (let c = 0; c < a.frames; c++) row.push(cut(src, c * a.frameW, r * a.frameH, a.frameW, a.frameH));
    frames.push(row);
  }
  return { frames, anchor: a.anchor, w: a.frameW, h: a.frameH, fps: a.fps, loop: a.loop ?? true };
}
/** En enda bild (riktning SV): samma textur i alla riktningar; Sprite speglas för östliga riktningar. */
function single(t: Texture, s: Size): Anim {
  return { frames: DIRS.map(() => [t]), anchor: s.anchor, w: s.w, h: s.h, fps: 1, loop: true, single: true };
}

/** Laddar och äger alla 2D-texturer (tiles, dekor, hjälte, monster, NPC, bakgrunder, ikoner). */
export class AssetStore {
  readonly tiles = new Map<string, Texture>();
  readonly decor = new Map<string, { tex: Texture; size: Size }>();
  readonly monsters = new Map<string, AnimSet>();
  readonly npcs = new Map<string, Anim>();
  readonly heroes = new HeroSprites();
  readonly backgrounds = new Map<string, Texture>();
  readonly effects = new Map<string, Texture>();
  iconIndex: Record<string, string> = {};

  async load(): Promise<void> {
    await Promise.all([
      this.loadTiles(),
      this.loadDecor(),
      this.loadHero(),
      this.loadMonsters(),
      this.loadNpcs(),
      this.loadBg(),
      this.loadIcons(),
    ]);
  }
  private async loadTiles(): Promise<void> {
    await Promise.all(TILES.map(async (t) => this.tiles.set(t, await tex(`2d/tiles/${t}.png`))));
  }
  private async loadDecor(): Promise<void> {
    const meta = await json<Record<string, Size>>('2d/dekor/dekor.json');
    await Promise.all(
      DECOR.map(async (d) => {
        const size = meta[d];
        if (size) this.decor.set(d, { tex: await tex(`2d/dekor/${d}.png`), size });
      }),
    );
  }
  private async loadHero(): Promise<void> {
    await this.heroes.load((p) => tex(p));
  }
  private async loadMonsters(): Promise<void> {
    // Datadrivet: index.json listar alla ark (<id>/<id>.json), monster.json alla enkelbilder.
    const index = await json<{ sheets: string[] }>('2d/sprites/monster/index.json');
    await Promise.all(
      index.sheets.map(async (id) => {
        const m = await json<{ anims: Record<AnimName, SheetAnim> }>(`2d/sprites/monster/${id}/${id}.json`);
        const set: AnimSet = {};
        await Promise.all(
          (Object.entries(m.anims) as [AnimName, SheetAnim][]).map(async ([k, a]) => {
            set[k] = sheet(await tex(`2d/sprites/monster/${id}/${a.file}`), a);
          }),
        );
        this.monsters.set(id, set);
      }),
    );
    const meta = await json<{ monster: Record<string, Size & { fil: string }> }>('2d/sprites/monster/monster.json');
    await Promise.all(
      Object.entries(meta.monster).map(async ([id, s]) => {
        if (this.monsters.has(id)) return;
        const a = single(await tex(`2d/sprites/monster/${s.fil}`), s);
        this.monsters.set(id, { idle: a, gang: a, attack: a });
      }),
    );
  }
  private async loadNpcs(): Promise<void> {
    const meta = await json<{ npc: Record<string, Size & { fil: string }> }>('2d/sprites/npc/npc.json');
    await Promise.all(Object.entries(meta.npc).map(async ([id, s]) => this.npcs.set(id, single(await tex(`2d/sprites/npc/${s.fil}`), s))));
  }
  private async loadBg(): Promise<void> {
    const list = ['himmel.jpg', 'fjarran_skog.png', 'fjarran_portalby.png', 'fjarran_stad.png'];
    await Promise.all(list.map(async (f) => this.backgrounds.set(f.replace(/\..*/, ''), await tex(`2d/bakgrund/${f}`))));
    await Promise.all(
      ['glod_rare', 'glod_set', 'glod_legendary'].map(async (f) => {
        try {
          this.effects.set(f, await tex(`effekter/${f}.png`));
        } catch {
          /* valfri effekt */
        }
      }),
    );
  }
  private async loadIcons(): Promise<void> {
    const idx = await json<Record<string, unknown>>('ikoner/index.json');
    for (const [k, v] of Object.entries(idx)) if (!k.startsWith('_') && typeof v === 'string') this.iconIndex[k] = v;
  }
  /** URL till föremålsikon (DOM), eller null. Sökordning: legendarisk, setdel, set.bas, bas. */
  iconUrl(keys: (string | undefined)[]): string | null {
    for (const k of keys) {
      const f = k ? this.iconIndex[k] : undefined;
      if (f) return assetUrl('ikoner/' + f);
    }
    return null;
  }
  frameUrl(quality: string): string {
    return assetUrl(
      `ikoner/ram_${quality === 'magic' || quality === 'rare' || quality === 'set' || quality === 'legendary' ? quality : 'normal'}.png`,
    );
  }
}

/** Skärmriktning (0–7, DIRS-ordning) för en världsriktning (dx österut, dy söderut) i isometrisk vy. */
export function dirIndex(dx: number, dy: number): number {
  const sx = dx - dy;
  const sy = (dx + dy) / 2;
  const a = (Math.atan2(sy, sx) * 180) / Math.PI;
  return ((Math.round((a - 90) / 45) % 8) + 8) % 8;
}
