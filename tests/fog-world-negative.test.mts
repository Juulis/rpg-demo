import assert from 'node:assert/strict';
import { FogOfWar } from '../src/map/FogOfWar';

const fog = new FogOfWar();
fog.setWorldAnchored(true);
fog.revealWorld('forest', -128, -128);
assert.ok(fog.isWorldRevealed('forest', -128, -128), 'startläger vid -128,-128 ska avslöjas');

const enc = fog.encodeZone('forest');
assert.ok(enc && enc[0] === 3, 'v3 sparformat');
assert.ok(enc.length > 500, 'chunk-bitmask ska sparas');

const f3 = new FogOfWar((zone) => (zone === 'forest' ? enc : null));
f3.setWorldAnchored(true);
assert.ok(f3.isWorldRevealed('forest', -128, -128), 'negativ koordinat ska överleva save/load');

console.log('fog-world-negative.test.mts: ok');
