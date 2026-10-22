// Pages-artefakt: 2D-bygget (dist/ från Vite) på roten. /next/ och /legacy-3d/ omdirigerar till roten.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const index = resolve(dist, 'index.html');
if (!existsSync(index)) {
  throw new Error('dist/index.html saknas — kör npm run build innan assemble-pages.mjs');
}
const html = readFileSync(index, 'utf8');
if (!html.includes('/assets/') && !html.includes('assets/')) {
  throw new Error('dist/index.html ser inte ut som Vite 2D-bygget (saknar assets/)');
}
if (existsSync(resolve(dist, 'game.js'))) {
  throw new Error('dist/ innehåller legacy 3D (game.js) — deploy ska bara innehålla 2D-bygget');
}

const redirectHtml = (to) =>
  `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"><script>location.replace("${to}" + location.search + location.hash)</script><a href="${to}">Till spelet</a>\n`;

for (const dir of ['next', 'legacy-3d']) {
  mkdirSync(resolve(dist, dir), { recursive: true });
  writeFileSync(resolve(dist, dir, 'index.html'), redirectHtml('../'));
}

console.log('Pages-rot klar (2D TS) · next/ och legacy-3d/ omdirigerar till roten');
