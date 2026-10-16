// Sätter ihop Pages-artefakten: 3D-spelet (legacy-3d/) oförändrat på roten av dist/, TS-versionen ligger i dist/next/.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
mkdirSync(dist, { recursive: true });
cpSync(resolve(root, 'legacy-3d'), dist, { recursive: true });
for (const f of ['index.html', 'game.js', 'js/save.js', 'data/klasser.json']) {
  if (!existsSync(resolve(dist, f))) throw new Error(`Pages-roten saknar ${f}`);
}
console.log(`Pages-rot klar (3D) · next/ ${existsSync(resolve(dist, 'next/index.html')) ? 'finns' : 'SAKNAS'}`);
// /legacy-3d/ (gammal länk) skickas vidare till roten där 3D-spelet ligger.
mkdirSync(resolve(dist, 'legacy-3d'), { recursive: true });
writeFileSync(
  resolve(dist, 'legacy-3d/index.html'),
  '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=../"><link rel="canonical" href="../"><script>location.replace("../" + location.search + location.hash)</script><a href="../">Till spelet</a>\n',
);
