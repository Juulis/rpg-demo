/**
 * Klassfärdigheter (#52): upplåsning, kostnad, cooldown, färdighetsrad.
 */
import assert from 'node:assert/strict';
import { DATA } from '../src/data';
import { Rng } from '../src/core/Rng';
import { HeroModel } from '../src/logic/HeroModel';
import { Loot } from '../src/logic/loot/Loot';
import type { HeroState } from '../src/core/GameContext';
import { barActiveSkills, canUseSkill, isPassiveSkill, skillUnlocked } from '../src/logic/skills';
import { Text } from '../src/text/Text';

const L = new Loot(new Text(), new Rng(1));

function hero(cls: string, level: number, fresh = false): HeroModel {
  const s: HeroState = {
    id: 't',
    name: 'T',
    cls,
    level,
    xp: 0,
    gold: 0,
    hp: 100,
    maxHp: 100,
    pos: { x: 0, y: 0 },
    inv: [],
    equip: {},
    stage: 0,
    runes: 0,
    city: '',
    zone: 'forest',
    facing: 0,
    playing: true,
    resumePos: null,
    fresh,
  };
  return new HeroModel(s, L);
}

const amazon = DATA.classes.classes.find((c) => c.id === 'amazonkrigare');
assert.ok(amazon);
const actives = barActiveSkills(amazon);
assert.equal(actives.length, 4);
assert.equal(actives[0]?.id, 'spjutstot');
const passive = amazon.skills.find((s) => s.id === 'jagarblick');
assert.ok(passive && isPassiveSkill(passive));

const h1 = hero('amazonkrigare', 1, true);
assert.equal(h1.countJavelins(), 5);
const sk0 = actives[0];
const sk1 = actives[1];
assert.ok(sk0 && skillUnlocked(sk0, 1));
assert.ok(sk1 && !skillUnlocked(sk1, 1));
assert.ok(sk1 && skillUnlocked(sk1, 2));

const sk2 = actives[1];
assert.ok(sk2);
h1.stamina = sk2.stamina_cost;
assert.ok(canUseSkill({ sk: sk2, heroLevel: 2, cooldownLeft: 0, stamina: h1.stamina }));
h1.skillCooldowns[sk2.id] = 1;
assert.ok(!canUseSkill({ sk: sk2, heroLevel: 2, cooldownLeft: h1.skillCdLeft(sk2.id), stamina: h1.stamina }));

const h5 = hero('riddare', 5);
assert.ok(h5.passiveActive('jarnvilja'));
assert.ok(!hero('riddare', 4).passiveActive('jarnvilja'));

console.log('skills.test.mts: ok');
