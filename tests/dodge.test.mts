/**
 * Undanmanöver (#15): data, i-frames, cooldown (ingen uthållighet).
 * Kör: npx tsx tests/dodge.test.mts
 */
import assert from 'node:assert/strict';
import { DATA } from '../src/data/index';
import { canStartDodge, dodgeProfile } from '../src/logic/dodge';
import { HeroModel } from '../src/logic/HeroModel';
import { Loot } from '../src/logic/loot/Loot';
import type { HeroState } from '../src/core/GameContext';

const L = new Loot(DATA);

function hero(cls = 'riddare'): HeroModel {
  const s: HeroState = {
    id: 't',
    name: 'T',
    cls,
    level: 1,
    xp: 0,
    gold: 0,
    hp: 100,
    maxHp: 100,
    pos: { x: 0, y: 0 },
    facing: 0,
    zone: 'forest',
    stage: 1,
    runes: 0,
    city: 'besatt',
    playing: true,
    fresh: false,
    resumePos: null,
    inv: [],
    equip: {},
  };
  return new HeroModel(s, L);
}

const riddare = dodgeProfile('riddare');
assert.equal(riddare.distance, 2.5);
assert.ok(riddare.shield);
assert.ok(dodgeProfile('amazonkrigare').distance > riddare.distance);

const h = hero();
assert.ok(h.tryDodge(1, 0));
assert.ok(h.dodging());
assert.ok(h.invulnerable());
assert.equal(!h.tryDodge(1, 0), true, 'cooldown blocks chain');

h.dodgeCd = 0;
h.dodgeRemain = 0;
h.iframeT = 0;
assert.ok(canStartDodge({ playing: true, dodgeCd: 0, dodgeRemain: 0, atkT: 0 }));
assert.equal(canStartDodge({ playing: true, dodgeCd: 1, dodgeRemain: 0, atkT: 0 }), false);

console.log('dodge.test.mts: ok');
