// Röktest av Pages-artefakten: servera dist/ under /rpg-demo/ och ladda roten (3D) och next/ (TS) i headless Chromium.
// Kräver: roten har spelets filer och laddar utan konsolfel/404; next/ laddar utan konsolfel (om den byggdes).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const dist = resolve(process.argv[2] ?? 'dist');
const requireNext = !process.argv.includes('--allow-missing-next');
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
for (const f of ['index.html', 'game.js', 'js/save.js', 'data/klasser.json', 'data/spawnzoner.json'])
  if (!existsSync(join(dist, f))) fail.push(`roten saknar ${f}`);
const hasNext = existsSync(join(dist, 'next/index.html'));
if (!hasNext && requireNext) fail.push('next/index.html saknas');

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
// Roten ska vara det spelbara 3D-spelet: game.js exponerar __rpg med newGame.
await visit('', () => typeof window.__rpg?.newGame === 'function' && !!document.querySelector('canvas'));
if (hasNext) await visit('next/', () => !!document.querySelector('#app canvas'));
await browser.close();
server.close();
if (fail.length) {
  console.error('Röktest misslyckades:\n- ' + fail.join('\n- '));
  process.exit(1);
}
console.log('Röktest OK');
