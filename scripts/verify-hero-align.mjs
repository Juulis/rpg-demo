/** Verifierar alignX/Y mot walk f0 (körs i CI utan att bygga om ark). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERO = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/assets/2d/sprites/hero');
const DIRS = ['S', 'SV', 'V', 'NV', 'N', 'NO', 'O', 'SO'];

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(HERO, name), 'utf8'));
}

function footMetrics(rgba, w, h) {
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] >= 30) maxY = Math.max(maxY, y);
    }
  }
  if (maxY < 0) return { footX: w / 2, footY: h - 1 };
  const y0 = Math.max(0, Math.floor(maxY - h * 0.06));
  let minX = w;
  let maxX = -1;
  for (let y = y0; y <= maxY; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] < 30) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }
  if (maxX < minX) return { footX: w / 2, footY: maxY };
  const span = maxX - minX + 1;
  const xLo = minX + span * 0.3;
  const xHi = minX + span * 0.7;
  const xs = [];
  for (let y = y0; y <= maxY; y++) {
    for (let x = 0; x < w; x++) {
      if (x < xLo || x > xHi) continue;
      if (rgba[(y * w + x) * 4 + 3] >= 30) xs.push(x);
    }
  }
  const footX = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : (minX + maxX) / 2;
  return { footX, footY: maxY };
}

async function loadRgba(pngPath) {
  const { data, info } = await sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function cropRgba(src, sw, sh, x, y, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const si = ((y + row) * sw + (x + col)) * 4;
      const di = (row * w + col) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }
  return out;
}

async function verifySheet(jsonName, walkMeta, refFootX, refFootY, maxErr, attackLoose) {
  const meta = readJson(jsonName);
  const { data, w: sw, h: sh } = await loadRgba(path.join(HERO, meta.image));
  const walkAx = walkMeta.anchor[0];
  const walkAy = walkMeta.anchor[1];
  const ax = meta.anchor[0];
  const ay = meta.anchor[1];
  let worst = 0;
  let worstAt = '';
  for (let d = 0; d < meta.dirs.length; d++) {
    const nFrame = meta.frames ?? 1;
    for (let f = 0; f < nFrame; f++) {
      const looseSheet = jsonName.includes('run') || jsonName.includes('dodge');
      const limit =
        jsonName.includes('attack') && f >= (meta.hitFrame ?? 3)
          ? attackLoose
          : looseSheet
            ? 20
            : maxErr;
      const r = meta.rects.find((q) => meta.dirs.indexOf(q.dir) === d && (q.frame ?? 0) === f);
      const crop = cropRgba(data, sw, sh, r.x, r.y, r.w, r.h);
      const { footX, footY } = footMetrics(crop, r.w, r.h);
      const adjX = footX - ax + (meta.alignX?.[d]?.[f] ?? 0);
      const adjY = footY - ay + (meta.alignY?.[d]?.[f] ?? 0);
      const err = Math.max(Math.abs(adjX - (refFootX[d] - walkAx)), Math.abs(adjY - (refFootY[d] - walkAy)));
      if (err > worst) {
        worst = err;
        worstAt = `${jsonName} ${meta.dirs[d]} f${f}`;
      }
      if (err > limit) throw new Error(`align-fel ${err}px > ${limit} @ ${meta.dirs[d]} f${f} (${jsonName})`);
    }
  }
  return { sheet: jsonName, worst, worstAt };
}

async function main() {
  const walkMeta = readJson('riddare_walk_8dir.json');
  const { data, w: sw, h: sh } = await loadRgba(path.join(HERO, walkMeta.image));
  const refFootX = [];
  const refFootY = [];
  for (let d = 0; d < DIRS.length; d++) {
    const r = walkMeta.rects.find((q) => q.dir === DIRS[d] && (q.frame ?? 0) === 0);
    const crop = cropRgba(data, sw, sh, r.x, r.y, r.w, r.h);
    const m = footMetrics(crop, r.w, r.h);
    refFootX.push(m.footX);
    refFootY.push(m.footY);
  }
  const sheets = ['riddare_idle_8dir.json', 'riddare_walk_8dir.json', 'riddare_attack_8dir.json'];
  const report = [];
  for (const s of sheets) report.push(await verifySheet(s, walkMeta, refFootX, refFootY, 3, 8));
  console.log('HERO_ALIGN_OK', JSON.stringify(report));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
