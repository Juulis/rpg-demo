import type { Anim, AnimName } from './spriteAnim';
import { assetUrl, DIRS } from './spriteAnim';
import { patchRunDiagonals } from './HeroSprites';
import { loadSheet8dir, type TexLoader } from './sheet8dir';
import { type AnimDrawOrders, type UtrustningLayer, UTRUSTNING_ANIM_TO_GAME } from './heroEquipment';

const BASE_DIR = '2d/sprites/hero/utrustning';
const HERO_SCALE = 0.55;

interface UtrustningIndexAnim {
  filer: Record<string, string>;
  orderPerVapen: Record<string, Record<string, string[]>>;
}

interface UtrustningIndex {
  anims: Record<string, UtrustningIndexAnim>;
}

function stemFromJsonFile(file: string): string {
  return file.replace(/\.json$/i, '');
}

function parseDrawOrders(spec: UtrustningIndexAnim): AnimDrawOrders {
  const orders: AnimDrawOrders = { svard: {}, yxa: {} };
  for (const weapon of ['svard', 'yxa'] as const) {
    const perDir = spec.orderPerVapen[weapon] ?? spec.orderPerVapen.svard ?? {};
    for (const d of DIRS) {
      if (perDir[d]) orders[weapon][d] = perDir[d];
    }
  }
  return orders;
}

/** Laddade riddar-lager + ritordning per animation (ärende #87). */
export class KnightEquipmentSprites {
  private ready = false;
  /** Per spel-AnimName, per lagernamn. */
  readonly layerAnims: Partial<Record<AnimName, Partial<Record<UtrustningLayer, Anim>>>> = {};
  /** Per spel-AnimName, ritordning per vapen och riktning. */
  readonly drawOrders: Partial<Record<AnimName, AnimDrawOrders>> = {};

  get isReady(): boolean {
    return this.ready;
  }

  async load(tex: TexLoader): Promise<void> {
    const res = await fetch(assetUrl(`${BASE_DIR}/riddare_utrustning.json`));
    if (!res.ok) {
      console.warn('[KnightEquipmentSprites] saknar riddare_utrustning.json');
      return;
    }
    const index = (await res.json()) as UtrustningIndex;

    const loadedByJsonAnim = new Map<string, Partial<Record<UtrustningLayer, Anim>>>();

    for (const [jsonAnim, spec] of Object.entries(index.anims)) {
      const byLayer: Partial<Record<UtrustningLayer, Anim>> = {};
      for (const [layer, file] of Object.entries(spec.filer)) {
        const stem = stemFromJsonFile(file);
        try {
          byLayer[layer as UtrustningLayer] = await loadSheet8dir(tex, BASE_DIR, stem, HERO_SCALE);
        } catch (e) {
          console.warn(`[KnightEquipmentSprites] kunde inte ladda ${stem}:`, e);
        }
      }
      loadedByJsonAnim.set(jsonAnim, byLayer);

      const gameAnim = UTRUSTNING_ANIM_TO_GAME[jsonAnim];
      if (!gameAnim || !byLayer.bas) continue;
      this.layerAnims[gameAnim] = byLayer;
      this.drawOrders[gameAnim] = parseDrawOrders(spec);
    }

    const walkLayers = loadedByJsonAnim.get('walk');
    const runLayers = loadedByJsonAnim.get('run');
    if (walkLayers && runLayers) {
      for (const [layer, runAnim] of Object.entries(runLayers)) {
        const walkAnim = walkLayers[layer as UtrustningLayer];
        if (runAnim && walkAnim) patchRunDiagonals(runAnim, walkAnim);
      }
    }

    this.ready = Object.keys(this.layerAnims).length > 0;
  }
}
