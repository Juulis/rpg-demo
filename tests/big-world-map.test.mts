import assert from 'node:assert/strict';
import { isInsideStartskogenChunk, heroInsideStartskogenRegion } from '../src/world/bigWorld/heroRegion';
import { bigWorldMapBounds } from '../src/map/bigWorldMapDraw';

assert.ok(isInsideStartskogenChunk(1, 1));
assert.ok(!isInsideStartskogenChunk(5, 5));
assert.ok(heroInsideStartskogenRegion({ x: 200, y: 200 }));

const [x0, , x1] = bigWorldMapBounds(100, 200, 4);
assert.ok(x1 - x0 > 0);

console.log('big-world-map.test.mts: ok');
