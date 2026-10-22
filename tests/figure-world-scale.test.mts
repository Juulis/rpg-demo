import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Texture } from 'pixi.js';
import {
  displayedWorldHeightM,
  FIGURE_HEIGHT_HUMAN_M,
  scaleKForWorldHeightM,
  worldHeightMForHeroOrNpc,
  worldHeightMForMonster,
} from '../src/render/figureWorldHeights';
import { animDisplayScale, animSetRefHeight } from '../src/render/spriteLayout';
import type { Anim, AnimSet } from '../src/render/spriteAnim';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/2d/sprites');
const HERO_SCALE = 0.55;
const NPC_SCALE = 0.8;
const REL_TOL = 0.08;

function readHeroSheet(name: string): { w: number; h: number; anchor: [number, number] } {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'hero', `${name}.json`), 'utf8')) as {
    frameW: number;
    frameH: number;
    anchor: [number, number];
  };
  return { w: meta.frameW, h: meta.frameH, anchor: meta.anchor };
}

function animFrom(w: number, h: number, anchor: [number, number], scale?: number): Anim {
  return { frames: [[Texture.EMPTY]], anchor, w, h, fps: 10, loop: true, scale };
}

function heroSet(): AnimSet {
  const walk = readHeroSheet('riddare_walk_8dir');
  const idle = readHeroSheet('riddare_idle_8dir');
  return {
    idle: animFrom(idle.w, idle.h, idle.anchor, HERO_SCALE),
    gang: animFrom(walk.w, walk.h, walk.anchor, HERO_SCALE),
    run: animFrom(readHeroSheet('riddare_run_8dir').w, readHeroSheet('riddare_run_8dir').h, walk.anchor, HERO_SCALE),
    attack: animFrom(readHeroSheet('riddare_attack_8dir').w, readHeroSheet('riddare_attack_8dir').h, walk.anchor, HERO_SCALE),
    dod: animFrom(readHeroSheet('riddare_dodge_8dir').w, readHeroSheet('riddare_dodge_8dir').h, walk.anchor, HERO_SCALE),
  };
}

function npcSet(): AnimSet {
  const id = 'tor_kolare';
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'npc', id, `${id}_idle_8dir.json`), 'utf8')) as {
    frameW: number;
    frameH: number;
    anchor: [number, number];
  };
  const a = animFrom(meta.frameW, meta.frameH, meta.anchor, NPC_SCALE);
  return { idle: a, gang: a };
}

function monsterSet(sheet: string): AnimSet {
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'monster', sheet, `${sheet}_idle_8dir.json`), 'utf8')) as {
    frameW: number;
    frameH: number;
    anchor: [number, number];
  };
  const a = animFrom(meta.frameW, meta.frameH, meta.anchor);
  return { idle: a, gang: a };
}

function assertNear(a: number, b: number, tol: number, label: string): void {
  const d = Math.abs(a - b) / Math.max(b, 0.01);
  assert.ok(d <= tol, `${label}: ${a.toFixed(3)} m vs ${b.toFixed(3)} m (diff ${(d * 100).toFixed(1)}%)`);
}

const hero = heroSet();
const npc = npcSet();
const wolf = monsterSet('skogsvarg');
const skeleton = monsterSet('skelett_krigare');

const heroHm = worldHeightMForHeroOrNpc();
const heroK = scaleKForWorldHeightM(hero, heroHm);
const npcK = scaleKForWorldHeightM(npc, heroHm);
const wolfHm = worldHeightMForMonster('skogsvarg', 'bestar');
const wolfK = scaleKForWorldHeightM(wolf, wolfHm);
const skHm = worldHeightMForMonster('skelett_krigare', 'ododa');
const skK = scaleKForWorldHeightM(skeleton, skHm);

const heroShown = displayedWorldHeightM(hero, heroK);
const npcShown = displayedWorldHeightM(npc, npcK);
const wolfShown = displayedWorldHeightM(wolf, wolfK);
const skShown = displayedWorldHeightM(skeleton, skK);

assertNear(heroShown, FIGURE_HEIGHT_HUMAN_M, 0.02, 'hjälte');
assertNear(npcShown, FIGURE_HEIGHT_HUMAN_M, 0.02, 'NPC');
assertNear(skShown, FIGURE_HEIGHT_HUMAN_M, 0.02, 'skelett');
assertNear(heroShown, npcShown, REL_TOL, 'hjälte vs NPC');
assertNear(heroShown, skShown, REL_TOL, 'hjälte vs skelett');
assertNear(wolfShown, wolfHm, 0.02, 'varg målhöjd');
assertNear(wolfShown / heroShown, wolfHm / heroHm, REL_TOL, 'varg/hjälte-förhållande');
assert.ok(wolfShown >= heroShown * 0.65, 'minsta varg känns farlig vs hjälte');

const refH = animSetRefHeight(hero);
for (const name of ['gang', 'attack', 'dod'] as const) {
  const a = hero[name];
  assert.ok(a, name);
  assert.equal(animDisplayScale(heroK, refH, a), animDisplayScale(heroK, refH, hero.gang!), `hjälte ${name} pixel-skala`);
}

console.log('figure-world-scale.test.mts: ok');
