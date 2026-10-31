// Röktest av Pages-artefakten: servera dist/ under /rpg-demo/ och verifiera 2D-spelet på roten.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const dist = resolve(process.argv[2] ?? 'dist');
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ogg': 'audio/ogg',
  '.glb': 'model/gltf-binary',
  '.jpg': 'image/jpeg',
};
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith('/rpg-demo/')) return void res.writeHead(404).end();
  if (url === '/rpg-demo/next/' || url.startsWith('/rpg-demo/legacy-3d')) {
    res.writeHead(302, { Location: '/rpg-demo/' });
    return void res.end();
  }
  let p = join(dist, url.slice('/rpg-demo/'.length));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) return void res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
  createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/rpg-demo/`;

const fail = [];
if (!existsSync(join(dist, 'index.html'))) fail.push('roten saknar index.html');
if (existsSync(join(dist, 'game.js'))) fail.push('roten innehåller legacy game.js (3D ska inte deployas)');
if (!existsSync(join(dist, 'assets'))) fail.push('roten saknar assets/ (Vite-bygget)');

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function visit(path, check) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && r.url().startsWith(base) && errs.push(`${r.status()} ${r.url()}`));
  await page.goto(base + path, { waitUntil: 'load' });
  await page.waitForTimeout(6000);
  const ok = await page.evaluate(check);
  if (!ok) errs.push('spelet startade inte (kontroll misslyckades)');
  console.log(`${path || '/'}: ${errs.length ? 'FEL' : 'OK'}`);
  for (const e of errs) fail.push(`${path || '/'}: ${e}`);
  await page.close();
}

async function startNewGame(page) {
  await page.waitForSelector('#hmNewHero', { timeout: 30000 });
  await page.click('#hmNewHero');
  await page.waitForSelector('.hero-name', { timeout: 10000 });
  await page.fill('.hero-name', 'Rök');
  await page.click('#hnOk');
  await page.waitForSelector('#app canvas', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.hero-menu')?.classList.contains('hidden'), null, { timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.zone === 'forest', null, { timeout: 30000 });
}

const gameReady = async () => {
  const d = document.documentElement.dataset;
  if (!document.querySelector('#app canvas') || d.zone !== 'forest' || !document.querySelector('#hud')) return false;
  if (d.bigWorld !== '1') return false;
  if (d.runes !== '3') return false;
  const cm = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
  document.querySelector('#app canvas').dispatchEvent(cm);
  const alt = new KeyboardEvent('keydown', { key: 'Alt', code: 'AltLeft', bubbles: true, cancelable: true });
  window.dispatchEvent(alt);
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt', code: 'AltLeft', bubbles: true, cancelable: true }));
  const labels = document.querySelector('#lootLabels');
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', bubbles: true }));
  await new Promise((r) => setTimeout(r, 200));
  const zOn = labels?.classList.contains('on');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'z', code: 'KeyZ', bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', bubbles: true }));
  await new Promise((r) => setTimeout(r, 200));
  const zOff = !labels?.classList.contains('on');
  return cm.defaultPrevented && alt.defaultPrevented && zOn && zOff;
};

await visit('', gameReady);

const chunkPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const chunkErrs = [];
chunkPage.on('pageerror', (e) => chunkErrs.push(String(e)));
await chunkPage.goto(base, { waitUntil: 'load' });
await startNewGame(chunkPage);
await chunkPage.waitForTimeout(4000);
const startProbe = await chunkPage.evaluate(() => ({
  chunk: document.documentElement.dataset.heroChunk ?? '',
  x: document.documentElement.dataset.heroWx ?? '',
  y: document.documentElement.dataset.heroWy ?? '',
}));
await chunkPage.keyboard.down('KeyD');
await chunkPage.keyboard.down('KeyW');
await chunkPage.waitForTimeout(9000);
await chunkPage.keyboard.up('KeyD');
await chunkPage.keyboard.up('KeyW');
await chunkPage.waitForTimeout(2000);
const chunkProbe = await chunkPage.evaluate(async (start) => {
  const endChunk = document.documentElement.dataset.heroChunk ?? '';
  const endX = Number(document.documentElement.dataset.heroWx ?? '0');
  const endY = Number(document.documentElement.dataset.heroWy ?? '0');
  const startX = Number(start.x || '0');
  const startY = Number(start.y || '0');
  const moved = Math.hypot(endX - startX, endY - startY) > 40;
  const displayObjects = Number(document.documentElement.dataset.groundObjects ?? '-1');
  let frames = 0;
  const t0 = performance.now();
  await new Promise((resolve) => {
    const loop = () => {
      frames++;
      if (performance.now() - t0 >= 2000) return resolve(undefined);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  const fps = frames / 2;
  const heapMb = (performance.memory?.usedJSHeapSize ?? 0) / (1024 * 1024);
  return {
    ok: (endChunk !== start.chunk && start.chunk.length > 0) || moved,
    startChunk: start.chunk,
    endChunk,
    moved,
    displayObjects,
    fps,
    heapMb,
  };
}, startProbe);
console.log(`chunk-stream: ${JSON.stringify(chunkProbe)}`);
if (!chunkProbe.ok) chunkErrs.push(`chunk oförändrad ${chunkProbe.startChunk} -> ${chunkProbe.endChunk}`);
if (chunkProbe.displayObjects > 35000) chunkErrs.push(`för många mark-objekt: ${chunkProbe.displayObjects}`);
if (chunkProbe.fps < 5) chunkErrs.push(`låg fps: ${chunkProbe.fps}`);
if (chunkErrs.length) fail.push(...chunkErrs.map((e) => `chunk: ${e}`));
await chunkPage.close();

for (const legacyPath of ['next/', 'legacy-3d/']) {
  const page = await browser.newPage();
  await page.goto(base + legacyPath, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const ok = new URL(page.url()).pathname === '/rpg-demo/';
  console.log(`${legacyPath}: ${ok ? 'OK (omdirigerad)' : 'FEL'}`);
  if (!ok) fail.push(`${legacyPath} omdirigerar inte till roten`);
  await page.close();
}

await browser.close();
server.close();
if (fail.length) {
  console.error('Röktest misslyckades:\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log('Röktest OK');
