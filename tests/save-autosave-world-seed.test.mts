import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus';
import type { GameEvents } from '../src/core/events';
import type { GameContext } from '../src/core/GameContext';
import { AutoSaveService } from '../src/save/AutoSaveService';
import type { HeroGateway } from '../src/save/HeroGateway';
import type { SaveRepository } from '../src/save/SaveRepository';
import { SAVE_VERSION, type SaveFile } from '../src/save/types';
import { patchLayerUsable } from '../src/world/bigWorld/BigWorldStreamGround';
import { Container as PixiContainer } from 'pixi.js';

const worldSeed = 424242;
const gameSeed = 9191;

const bus = new EventBus<GameEvents>();
const ctx: GameContext = {
  bus,
  hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {}, zone: 'forest', facing: 0, playing: true },
  zone: { name: 'forest' } as GameContext['zone'],
  session: { seed: gameSeed, worldSeed, killed: new Set() },
  data: {} as GameContext['data'],
  rng: {} as GameContext['rng'],
  worldState: {} as GameContext['worldState'],
  clock: {} as GameContext['clock'],
};

const saved: SaveFile[] = [];
const repo: SaveRepository = {
  backend: {
    setActiveHero: () => undefined,
    getSetting: async () => null,
    setSetting: async () => undefined,
  },
  save: async (f) => {
    saved.push(structuredClone(f));
    return true;
  },
} as unknown as SaveRepository;

const game: HeroGateway = {
  getSnapshot: () => ({
    hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
    game: {
      seed: gameSeed,
      worldSeed,
      killed: [],
      zone: 'forest',
      pos: { x: 1, y: 2 },
      stage: 0,
      runes: 0,
      city: 'besatt',
    },
  }),
  loadHero: () => undefined,
  setSaveBackend: () => undefined,
};

const autosave = new AutoSaveService(ctx, game, repo);
autosave.start();
const base: SaveFile = {
  version: SAVE_VERSION,
  hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: gameSeed, worldSeed, killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt' },
};
autosave.begin(base);
await autosave.saveNow('test');
assert.equal(saved.at(-1)?.game?.worldSeed, worldSeed, 'AutoSaveService.snapshot ska skriva worldSeed');

const layer = new PixiContainer();
assert.ok(patchLayerUsable(layer));
layer.destroy({ children: true });
assert.equal(patchLayerUsable(layer), false);

console.log('save-autosave-world-seed.test.mts: ok');
