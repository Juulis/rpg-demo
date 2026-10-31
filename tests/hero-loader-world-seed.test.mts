import assert from 'node:assert/strict';
import { EventBus } from '../src/core/EventBus';
import type { GameEvents } from '../src/core/events';
import type { GameContext, HeroSave } from '../src/core/GameContext';
import { createSession } from '../src/core/Session';
import { HeroLoader } from '../src/save/HeroLoader';
import type { AutoSaveService } from '../src/save/AutoSaveService';
import type { HeroGateway } from '../src/save/HeroGateway';
import { newGameRecord, type SaveFile } from '../src/save/types';
import { DATA } from '../src/data';

const bus = new EventBus<GameEvents>();
const ctx: GameContext = {
  bus,
  hero: {
    id: 'h1',
    name: 'T',
    cls: 'riddare',
    level: 1,
    xp: 0,
    gold: 0,
    zone: 'forest',
    playing: false,
    stage: 0,
    runes: 0,
    city: 'besatt',
    resumePos: null,
  },
  zone: { name: 'forest', areaId: 'startskogen', bigWorldStreaming: true },
  session: createSession(111, [], 999888777),
  data: DATA,
  rng: { int: () => 0, float: () => 0, pick: <T,>(a: readonly T[]) => a[0] as T },
  worldState: {
    get: () => ({}),
    replace: () => undefined,
    snapshot: () => ({}),
    resetForNewRun: () => undefined,
    setRunesActive: () => undefined,
    setCityState: () => undefined,
    setGameDay: () => undefined,
    tickPending: () => undefined,
  },
  clock: { day: 1, isNight: false },
};

const fakeAutosave = {
  end: () => undefined,
  begin: () => undefined,
  saveNow: async () => undefined,
  isPlaying: false,
} as unknown as AutoSaveService;

let lastLoad: HeroSave | null = null;
const game: HeroGateway = {
  loadHero: (s) => {
    lastLoad = s;
  },
  getSnapshot: () => ({ hero: {}, game: null, worldState: {} }),
  setSaveBackend: () => undefined,
};

let nextSeed = 1000;
const loader = new HeroLoader(ctx, game, fakeAutosave, () => nextSeed++, 50);

const baseSave = (): SaveFile => ({
  version: 2,
  hero: { id: 'a', name: 'A', cls: 'riddare', level: 1, xp: 0, gold: 0, inv: [], equip: {} },
  game: null,
});

nextSeed = 5000;
await loader.start(baseSave(), false);
assert.ok(lastLoad?.game);
assert.equal(lastLoad.game.worldSeed, 5001, 'första game får egen worldSeed');

const existing: SaveFile = {
  ...baseSave(),
  game: { ...newGameRecord(7777), worldSeed: 42424242 },
};
await loader.start(existing, false);
assert.equal(lastLoad?.game?.worldSeed, 42424242, 'Nytt game behåller worldSeed');
assert.notEqual(lastLoad?.game?.seed, 7777, 'game_seed byts vid Nytt game');

console.log('hero-loader-world-seed.test.mts: ok');
