/**
 * Test for R5-M1: save_failed event emitted on repo save failure.
 * Also covers callers returning false.
 */
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus';
import type { GameEvents } from '../src/core/events';
import type { GameContext } from '../src/core/GameContext';
import { AutoSaveService } from '../src/save/AutoSaveService';
import type { HeroGateway } from '../src/save/HeroGateway';
import type { SaveRepository } from '../src/save/SaveRepository';
import { SAVE_VERSION, type SaveFile } from '../src/save/types';

const bus = new EventBus<GameEvents>();
const received: Array<{ reason?: string }> = [];
bus.on('save_failed', (p) => received.push(p));

const ctx: GameContext = {
  bus,
  hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {}, zone: 'forest', facing: 0, playing: true },
  zone: { name: 'forest' } as GameContext['zone'],
  session: { seed: 1, worldSeed: 1, killed: new Set() },
  data: {} as GameContext['data'],
  rng: {} as GameContext['rng'],
  worldState: {} as GameContext['worldState'],
  clock: {} as GameContext['clock'],
};

let shouldFail = false;
const repo: SaveRepository = {
  backend: { setActiveHero: () => undefined, getSetting: async () => null, setSetting: async () => undefined },
  save: async () => {
    if (shouldFail) return false;
    return true;
  },
} as unknown as SaveRepository;

const game: HeroGateway = {
  getSnapshot: () => ({
    hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
    game: { seed: 1, killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt' },
  }),
  loadHero: () => undefined,
  setSaveBackend: () => undefined,
};

const autosave = new AutoSaveService(ctx, game, repo);
autosave.start();
const base: SaveFile = {
  version: SAVE_VERSION,
  hero: { id: 'h1', name: 'T', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: { seed: 1, killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt' },
};
autosave.begin(base);

const ok1 = await autosave.saveNow('ok');
assert.equal(ok1, true, 'normal save ska returnera true');
assert.equal(received.length, 0, 'inget save_failed vid lyckad sparning');

shouldFail = true;
const ok2 = await autosave.saveNow('fail-reason');
assert.equal(ok2, false, 'misslyckad save ska returnera false');
assert.equal(received.length, 1, 'save_failed ska ha emit:ats');
assert.equal(received[0]?.reason, 'fail-reason');

console.log('save-failed.test.mts: ok');
