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

async function readMetrics(page) {
  return page.evaluate(() => {
    const cap = window.__game?.captureBigWorldMetrics?.();
    if (cap) return { ...cap, heroChunk: document.documentElement.dataset.heroChunk ?? '' };
    const d = document.documentElement.dataset;
    return {
      groundReady: d.groundReady === '1',
      displayObjects: Number(d.groundObjects ?? 0),
      renderTextures: Number(d.renderTextures ?? 0),
      groundPixel: d.groundPixel === '1',
      heroWx: Number(d.heroWx ?? 0),
      heroWy: Number(d.heroWy ?? 0),
      heroChunk: d.heroChunk ?? '',
    };
  });
}

async function visit(path, check, startGame = false) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && r.url().startsWith(base) && errs.push(`${r.status()} ${r.url()}`));
  await page.goto(base + path, { waitUntil: 'load' });
  if (startGame) await startNewGame(page);
  else await page.waitForTimeout(6000);
  const ok = await page.evaluate(check);
  if (!ok) errs.push('spelet startade inte (kontroll misslyckades)');
  console.log(`${path || '/'}: ${errs.length ? 'FEL' : 'OK'}`);
  for (const e of errs) fail.push(`${path || '/'}: ${e}`);
  await page.close();
}

async function startNewGame(page, heroName = 'Rök') {
  await page.waitForSelector('#hmNewHero', { timeout: 30000 });
  await page.click('#hmNewHero');
  await page.waitForSelector('.hero-name', { timeout: 10000 });
  await page.fill('.hero-name', heroName);
  await page.click('#hnOk');
  await page.waitForSelector('#app canvas', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.hero-menu')?.classList.contains('hidden'), null, { timeout: 90000 });
  await page.waitForFunction(() => document.documentElement.dataset.zone === 'forest', null, { timeout: 90000 });
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

await visit('', gameReady, true);

const chunkPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const chunkErrs = [];
chunkPage.on('pageerror', (e) => chunkErrs.push(String(e)));
chunkPage.on('console', (m) => m.type() === 'error' && chunkErrs.push(m.text()));
await chunkPage.goto(base, { waitUntil: 'load' });
await startNewGame(chunkPage, 'Chunk');

async function waitGroundReady(page, ms = 120000) {
  await page.waitForFunction(
    () => window.__game?.captureBigWorldMetrics?.()?.groundReady === true || document.documentElement.dataset.groundReady === '1',
    null,
    { timeout: ms, polling: 200 },
  );
}

try {
  await waitGroundReady(chunkPage);
} catch {
  chunkErrs.push('mark blev inte klar (groundReady)');
}

const startProbe = await readMetrics(chunkPage);
const startPos = { x: startProbe.heroWx, y: startProbe.heroWy };

await chunkPage.evaluate(() => window.__smoke?.moveHeroBy(55, 55));
await chunkPage.waitForFunction(
  (start) => {
    if (!start) return false;
    const d = document.documentElement.dataset;
    const wx = Number(d.heroWx ?? start.x);
    const wy = Number(d.heroWy ?? start.y);
    return Math.hypot(wx - start.x, wy - start.y) > 40;
  },
  startPos,
  { timeout: 90000, polling: 200 },
);

const afterMove = await readMetrics(chunkPage);
const startChunk = afterMove.heroChunk || '0,0';
let crossed = false;
for (let attempt = 0; attempt < 36 && !crossed; attempt++) {
  await chunkPage.evaluate(() => window.__smoke?.moveHeroBy(48, 0));
  try {
    await chunkPage.waitForFunction(
      (prev) => {
        const c = document.documentElement.dataset.heroChunk;
        return !!c && c !== prev;
      },
      startChunk,
      { timeout: 12000, polling: 250 },
    );
    crossed = true;
  } catch {
    /* CI/SwiftShader: fortsätt nudge tills chunk-index uppdateras */
  }
}
if (!crossed) chunkErrs.push('chunkbyte: heroChunk ändrades inte');
const wxBefore = Number((await readMetrics(chunkPage)).heroWx);
await chunkPage.waitForTimeout(2500);
await chunkPage.evaluate(() => window.__smoke?.moveHeroBy(20, 0));
await chunkPage.waitForTimeout(2500);
const wxAfter = Number((await readMetrics(chunkPage)).heroWx);
if (Math.abs(wxAfter - wxBefore) < 0.5) chunkErrs.push('ingen rörelse efter chunkbyte');

const chunkProbe = await chunkPage.evaluate(
  async (start) => {
    const read = () => {
      const cap = window.__game?.captureBigWorldMetrics?.();
      if (cap) return cap;
      const d = document.documentElement.dataset;
      return {
        groundReady: d.groundReady === '1',
        displayObjects: Number(d.groundObjects ?? 0),
        renderTextures: Number(d.renderTextures ?? 0),
        groundPixel: d.groundPixel === '1',
        heroWx: Number(d.heroWx ?? 0),
        heroWy: Number(d.heroWy ?? 0),
      };
    };
    const m = read();
    if (!m || !start) return { ok: false, reason: 'no metrics' };
    const moved = Math.hypot(m.heroWx - start.x, m.heroWy - start.y) > 40;
    const fpsSamples = [];
    for (let s = 0; s < 5; s++) {
      let frames = 0;
      const t0 = performance.now();
      await new Promise((resolve) => {
        const loop = () => {
          frames++;
          if (performance.now() - t0 >= 1000) return resolve(undefined);
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
      fpsSamples.push(frames);
    }
    fpsSamples.sort((a, b) => a - b);
    const fpsMedian = fpsSamples[2] ?? fpsSamples[0] ?? 0;
    const heapMb = (performance.memory?.usedJSHeapSize ?? 0) / (1024 * 1024);
    return {
      ok: moved && m.groundPixel,
      moved,
      groundPixel: m.groundPixel,
      textures: m.renderTextures,
      objects: m.displayObjects,
      fpsMedian,
      heapMb,
      start,
    };
  },
  { x: startPos.x, y: startPos.y, textures: startProbe.renderTextures, objects: startProbe.displayObjects, pixel: startProbe.groundPixel },
);

console.log(`chunk-stream: ${JSON.stringify(chunkProbe)}`);
if (!chunkProbe.ok) chunkErrs.push(`rörelse/mark: moved=${chunkProbe.moved} pixel=${chunkProbe.groundPixel}`);
if (!chunkProbe.moved) chunkErrs.push('hjälten rörde sig inte >40 enheter');
if (!chunkProbe.groundPixel) chunkErrs.push('pixelprov såg ingen mark');
if (chunkProbe.textures > 50) chunkErrs.push(`för många RT: ${chunkProbe.textures}`);
if (chunkProbe.fpsMedian < 2) chunkErrs.push(`låg median-fps: ${chunkProbe.fpsMedian}`);

const heroId = await chunkPage.evaluate(() => {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('rpg_hero_'));
  const last = keys.sort().pop();
  if (!last) return null;
  try {
    const raw = JSON.parse(localStorage.getItem(last) || 'null');
    return raw?.game?.worldSeed != null ? { id: raw.hero?.id, worldSeed: raw.game.worldSeed, seed: raw.game.seed } : null;
  } catch {
    return null;
  }
});
if (!heroId?.worldSeed) chunkErrs.push('autospar saknar worldSeed i localStorage');
else {
  const ws0 = heroId.worldSeed;
  await chunkPage.reload({ waitUntil: 'load' });
  await pageWaitMenu(chunkPage);
  await chunkPage.click('#hmCont');
  await chunkPage.waitForFunction(() => document.documentElement.dataset.zone === 'forest', null, { timeout: 90000 });
  const ws1 = await chunkPage.evaluate((id) => {
    const raw = JSON.parse(localStorage.getItem(`rpg_hero_${id}`) || 'null');
    return raw?.game?.worldSeed ?? null;
  }, heroId.id);
  if (ws1 !== ws0) chunkErrs.push(`worldSeed ändrades efter Fortsätt: ${ws0} -> ${ws1}`);
}

if (chunkErrs.length) fail.push(...chunkErrs.map((e) => `chunk: ${e}`));
await chunkPage.close();

async function pageWaitMenu(page) {
  await page.waitForSelector('#hmNewHero', { timeout: 30000 });
}

for (const legacyPath of ['next/', 'legacy-3d/']) {
  const page = await browser.newPage();
  await page.goto(base + legacyPath, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const ok = new URL(page.url()).pathname.endsWith('/rpg-demo/') || new URL(page.url()).pathname === '/rpg-demo/';
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
