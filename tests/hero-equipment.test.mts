import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  equipmentActiveLayers,
  equipmentDrawOrder,
  equipmentDrawOrderUnarmed,
  type AnimDrawOrders,
  weaponVisualFromType,
} from '../src/render/heroEquipment';

const indexPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public/assets/2d/sprites/hero/utrustning/riddare_utrustning.json',
);

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8')) as {
  anims: { walk: { orderPerVapen: AnimDrawOrders } };
};

const walkOrders = index.anims.walk.orderPerVapen;

assert.equal(weaponVisualFromType('yxa'), 'yxa');
assert.equal(weaponVisualFromType('svard'), 'svard');
assert.equal(weaponVisualFromType('dolk'), 'svard');
assert.equal(weaponVisualFromType('bage'), null);
assert.equal(weaponVisualFromType(null), null);

const fullEquip = equipmentActiveLayers({ brost: { uid: 1, base: 'x' }, hjalm: { uid: 2, base: 'y' } }, true, 'svard');
assert.ok(fullEquip.has('bas'));
assert.ok(fullEquip.has('rustning'));
assert.ok(fullEquip.has('hjalm'));
assert.ok(fullEquip.has('skold'));
assert.ok(fullEquip.has('svard_bak'));
assert.ok(fullEquip.has('svard_fram'));
assert.equal(fullEquip.has('yxa_bak'), false);

const bare = equipmentActiveLayers({}, false, null);
assert.deepEqual([...bare], ['bas']);

const yxaActive = equipmentActiveLayers({}, false, 'yxa');
assert.ok(yxaActive.has('yxa_bak'));
assert.ok(yxaActive.has('yxa_fram'));
assert.equal(yxaActive.has('svard_bak'), false);

const activeSword = equipmentActiveLayers({ brost: { uid: 1, base: 'x' } }, false, 'svard');
const orderN = equipmentDrawOrder(walkOrders, 'svard', 4, activeSword);
assert.deepEqual(orderN, ['svard_bak', 'bas', 'rustning', 'svard_fram']);

const withShield = equipmentActiveLayers({ brost: { uid: 1, base: 'x' } }, true, 'svard');
const orderSV = equipmentDrawOrder(walkOrders, 'svard', 1, withShield);
const skoldIdx = orderSV.indexOf('skold');
const framIdx = orderSV.indexOf('svard_fram');
assert.ok(skoldIdx >= 0 && framIdx >= 0);
assert.ok(framIdx < skoldIdx, 'SV: svärd fram före sköld');

const orderYxa = equipmentDrawOrder(walkOrders, 'yxa', 0, yxaActive);
assert.ok(orderYxa.includes('yxa_bak'));
assert.equal(orderYxa.includes('svard_bak'), false);

const unarmed = equipmentDrawOrderUnarmed(walkOrders, 4, bare);
assert.deepEqual(unarmed, ['bas']);
assert.equal(unarmed.includes('svard_bak'), false);

console.log('hero-equipment.test.mts: ok');
