import { Assets as PixiAssets, CanvasSource, Texture } from 'pixi.js';
import { assetUrl } from './spriteAnim';

const BACKOFF_MS = [80, 160];

let placeholder: Texture | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Delad placeholder (lila 2×2) när en textur inte kan laddas. */
export function placeholderTexture(): Texture {
  if (placeholder) return placeholder;
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 2;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#8866aa';
    ctx.fillRect(0, 0, 2, 2);
  }
  placeholder = new Texture({ source: new CanvasSource({ resource: c }) });
  return placeholder;
}

/** Försök upp till tre gånger, sedan fallback. Loggar varning. */
export async function withRetries<T>(label: string, fn: () => Promise<T>, fallback: () => T): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt < BACKOFF_MS.length) await sleep(BACKOFF_MS[attempt] ?? 0);
    }
  }
  console.warn(`[AssetStore] ${label} — använder fallback`, last);
  return fallback();
}

export async function loadTextureResilient(path: string): Promise<Texture> {
  return withRetries(
    `textur ${path}`,
    () => PixiAssets.load<Texture>(assetUrl(path)),
    () => placeholderTexture(),
  );
}

export async function fetchJsonResilient<T>(path: string, fallback: T): Promise<T> {
  return withRetries(
    `json ${path}`,
    async () => {
      const r = await fetch(assetUrl(path));
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as T;
    },
    () => fallback,
  );
}
