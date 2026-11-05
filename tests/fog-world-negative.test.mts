import assert from 'node:assert/strict';
import { FogOfWar } from '../src/map/FogOfWar';

const fog = new FogOfWar();
fog.setWorldAnchored(true);
fog.revealWorld('forest', -128, -128);
assert.ok(fog.isWorldRevealed('forest', -128, -128), 'startläger vid -128,-128 ska avslöjas');

const enc = fog.encodeZone('forest');
assert.ok(enc && (enc[0] === 4 || enc[0] === 3), 'v4/v3 sparformat (backcompat writer)');
// V4 with RLE is much smaller for sparse data; ensure non-trivial payload after header
assert.ok(enc.length > 8, 'chunk-bitmask ska sparas');

const f3 = new FogOfWar((zone) => (zone === 'forest' ? enc : null));
f3.setWorldAnchored(true);
assert.ok(f3.isWorldRevealed('forest', -128, -128), 'negativ koordinat ska överleva save/load');

console.log('fog-world-negative.test.mts: ok');
