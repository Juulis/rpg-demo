/**
 * Bygger riddarens ark: idle från walk f0 (2-frame andning), halverad upplösning,
 * WebP + PNG, per-frame fotjustering (alignX/Y) mot walk f0 per riktning.
 * Kör: node scripts/build-hero-sprites.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HERO = path.join(__dirname, '../public/assets/2d/sprites/hero');
const DIRS = ['S', 'SV', 'V', 'NV', 'N', 'NO', 'O', 'SO'];
const SCALE = 0.5;
const MAX_ALIGN = 2;

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(HERO, name), 'utf8'));
}

function writeJson(name, data) {
  fs.writeFileSync(path.join(HERO, name), JSON.stringify(data, null, 1) + '\n');
}

/** Fotcentrum (x) och bbox-botten från RGBA-ruta. */
function footMetrics(rgba, w, h) {
  let minY = h;
  let maxY = -1;
  const footXs = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = rgba[(y * w + x) * 4 + 3];
      if (a < 30) continue;
      if (y > maxY) maxY = y;
      if (y < minY) minY = y;
    }
  }
  if (maxY < 0) return { footX: w / 2, footY: h - 1 };
  const y0 = Math.max(0, Math.floor(maxY - h * 0.06));
  for (let y = y0; y <= maxY; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] >= 30) footXs.push(x);
    }
  }
  const footX = footXs.length ? footXs.reduce((a, b) => a + b, 0) / footXs.length : w / 2;
  return { footX, footY: maxY };
}

async function loadRgba(pngPath) {
  const { data, info } = await sharp(pngPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function cropRgba(src, sw, sh, x, y, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    const sy = y + row;
    if (sy < 0 || sy >= sh) continue;
    for (let col = 0; col < w; col++) {
      const sx = x + col;
      if (sx < 0 || sx >= sw) continue;
      const si = (sy * sw + sx) * 4;
      const di = (row * w + col) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }
  return out;
}

async function scaleSheet(jsonName) {
  const meta = readJson(jsonName);
  const pngName = meta.image;
  const srcPath = path.join(HERO, pngName);
  const { data: src, w: sw, h: sh } = await loadRgba(srcPath);
  const nDir = meta.dirs.length;
  const nFrame = meta.frames ?? 1;
  const FW = Math.round(meta.frameW * SCALE);
  const FH = Math.round(meta.frameH * SCALE);
  const ax = Math.round(meta.anchor[0] * SCALE);
  const ay = Math.round(meta.anchor[1] * SCALE);
  const sheetW = FW * nFrame;
  const sheetH = FH * nDir;
  const out = Buffer.alloc(sheetW * sheetH * 4);

  const rects = [];
  for (let d = 0; d < nDir; d++) {
    for (let f = 0; f < nFrame; f++) {
      const r = meta.rects.find((q) => meta.dirs.indexOf(q.dir) === d && (q.frame ?? 0) === f);
      if (!r) throw new Error(`${jsonName}: saknar ${meta.dirs[d]} f${f}`);
      const crop = cropRgba(src, sw, sh, r.x, r.y, r.w, r.h);
      const scaled = await sharp(crop, { raw: { width: r.w, height: r.h, channels: 4 } })
        .resize(FW, FH, { kernel: sharp.kernel.lanczos3 })
        .raw()
        .toBuffer();
      const dx = f * FW;
      const dy = d * FH;
      for (let row = 0; row < FH; row++) {
        for (let col = 0; col < FW; col++) {
          const si = (row * FW + col) * 4;
          const di = ((dy + row) * sheetW + dx + col) * 4;
          out[di] = scaled[si];
          out[di + 1] = scaled[si + 1];
          out[di + 2] = scaled[si + 2];
          out[di + 3] = scaled[si + 3];
        }
      }
      rects.push({ dir: meta.dirs[d], frame: f, x: dx, y: dy, w: FW, h: FH });
    }
  }

  const base = pngName.replace(/\.png$/i, '');
  const outPng = `${base}.png`;
  const outWebp = `${base}.webp`;
  await sharp(out, { raw: { width: sheetW, height: sheetH, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(HERO, outPng));
  await sharp(out, { raw: { width: sheetW, height: sheetH, channels: 4 } }).webp({ quality: 88 }).toFile(path.join(HERO, outWebp));

  const next = {
    ...meta,
    image: outPng,
    imageWebp: outWebp,
    frameW: FW,
    frameH: FH,
    anchor: [ax, ay],
    rects,
  };
  if (meta.hitFrame !== undefined) next.hitFrame = meta.hitFrame;
  writeJson(jsonName, next);
  return next;
}

async function buildIdleFromWalk(walkMeta) {
  const walkPng = path.join(HERO, walkMeta.image);
  const { data: src, w: sw, h: sh } = await loadRgba(walkPng);
  const FW = walkMeta.frameW;
  const FH = walkMeta.frameH;
  const ax = walkMeta.anchor[0];
  const ay = walkMeta.anchor[1];
  const nDir = DIRS.length;
  const nFrame = 2;
  const sheetW = FW * nFrame;
  const sheetH = FH * nDir;
  const out = Buffer.alloc(sheetW * sheetH * 4, 0);

  const rects = [];
  for (let d = 0; d < nDir; d++) {
    const dir = DIRS[d];
    const r0 = walkMeta.rects.find((q) => q.dir === dir && (q.frame ?? 0) === 0);
    if (!r0) throw new Error(`walk saknar ${dir} f0`);
    const crop = cropRgba(src, sw, sh, r0.x, r0.y, r0.w, r0.h);
    for (let f = 0; f < nFrame; f++) {
      const dy = f === 1 ? -1 : 0;
      const frameBuf = Buffer.from(crop);
      if (dy !== 0) {
        const shifted = Buffer.alloc(FW * FH * 4, 0);
        for (let row = 0; row < FH; row++) {
          const sr = row - dy;
          if (sr < 0 || sr >= FH) continue;
          for (let col = 0; col < FW; col++) {
            const si = (sr * FW + col) * 4;
            const di = (row * FW + col) * 4;
            shifted[di] = frameBuf[si];
            shifted[di + 1] = frameBuf[si + 1];
            shifted[di + 2] = frameBuf[si + 2];
            shifted[di + 3] = frameBuf[si + 3];
          }
        }
        frameBuf.set(shifted);
      }
      const dx = f * FW;
      const dySheet = d * FH;
      for (let row = 0; row < FH; row++) {
        for (let col = 0; col < FW; col++) {
          const si = (row * FW + col) * 4;
          const di = ((dySheet + row) * sheetW + dx + col) * 4;
          out[di] = frameBuf[si];
          out[di + 1] = frameBuf[si + 1];
          out[di + 2] = frameBuf[si + 2];
          out[di + 3] = frameBuf[si + 3];
        }
      }
      rects.push({ dir, frame: f, x: dx, y: dySheet, w: FW, h: FH });
    }
  }

  const outPng = 'riddare_idle_8dir.png';
  const outWebp = 'riddare_idle_8dir.webp';
  await sharp(out, { raw: { width: sheetW, height: sheetH, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(HERO, outPng));
  await sharp(out, { raw: { width: sheetW, height: sheetH, channels: 4 } }).webp({ quality: 88 }).toFile(path.join(HERO, outWebp));

  const idle = {
    image: outPng,
    imageWebp: outWebp,
    frameW: FW,
    frameH: FH,
    anchor: [ax, ay],
    dirs: DIRS,
    frames: nFrame,
    fps: 2,
    loop: true,
    rects,
  };
  writeJson('riddare_idle_8dir.json', idle);
  return idle;
}

async function addAlignFields(jsonName, refFootX, refFootY) {
  const meta = readJson(jsonName);
  const { data, w: sw, h: sh } = await loadRgba(path.join(HERO, meta.image));
  const alignX = [];
  const alignY = [];
  for (let d = 0; d < meta.dirs.length; d++) {
    const rowX = [];
    const rowY = [];
    const nFrame = meta.frames ?? 1;
    for (let f = 0; f < nFrame; f++) {
      const r = meta.rects.find((q) => meta.dirs.indexOf(q.dir) === d && (q.frame ?? 0) === f);
      const crop = cropRgba(data, sw, sh, r.x, r.y, r.w, r.h);
      const { footX, footY } = footMetrics(crop, r.w, r.h);
      let dx = Math.round(footX - refFootX[d]);
      let dy = Math.round(footY - refFootY[d]);
      dx = Math.max(-MAX_ALIGN, Math.min(MAX_ALIGN, dx));
      dy = Math.max(-MAX_ALIGN, Math.min(MAX_ALIGN, dy));
      rowX.push(dx);
      rowY.push(dy);
    }
    alignX.push(rowX);
    alignY.push(rowY);
  }
  meta.alignX = alignX;
  meta.alignY = alignY;
  writeJson(jsonName, meta);
}

async function main() {
  const sheets = ['riddare_walk_8dir.json', 'riddare_run_8dir.json', 'riddare_attack_8dir.json'];
  for (const s of sheets) await scaleSheet(s);
  const walk = readJson('riddare_walk_8dir.json');
  await buildIdleFromWalk(walk);

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

  for (const s of ['riddare_idle_8dir.json', ...sheets]) await addAlignFields(s, refFootX, refFootY);
  console.log('Hero sprites rebuilt. Total PNG:');
  const files = fs.readdirSync(HERO).filter((f) => f.endsWith('.png') || f.endsWith('.webp'));
  let total = 0;
  for (const f of files) {
    const sz = fs.statSync(path.join(HERO, f)).size;
    total += sz;
    console.log(`  ${f}: ${(sz / 1024).toFixed(0)} KiB`);
  }
  console.log(`  sum: ${(total / 1024 / 1024).toFixed(2)} MiB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
