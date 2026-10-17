/**
 * Bygger riddarens ark: idle från walk f0, halverad upplösning, PNG,
 * per-frame fotjustering (alignX/Y) mot walk f0 per riktning.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HERO = path.join(__dirname, '../public/assets/2d/sprites/hero');
const DIRS = ['S', 'SV', 'V', 'NV', 'N', 'NO', 'O', 'SO'];
const SCALE = 0.5;

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(HERO, name), 'utf8'));
}

function writeJson(name, data) {
  delete data.imageWebp;
  fs.writeFileSync(path.join(HERO, name), JSON.stringify(data, null, 1) + '\n');
}

/** Fotcentrum från nedersta raderna, bara mittbandet av fotbredden (mantel utesluten). */
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
  const srcPath = path.join(HERO, meta.image);
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

  const outPng = meta.image.replace(/\.png$/i, '') + '.png';
  await sharp(out, { raw: { width: sheetW, height: sheetH, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(HERO, outPng));

  const next = {
    ...meta,
    image: outPng,
    frameW: FW,
    frameH: FH,
    anchor: [ax, ay],
    rects,
  };
  delete next.imageWebp;
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
  const nFrame = 2;
  const sheetW = FW * nFrame;
  const sheetH = FH * DIRS.length;
  const out = Buffer.alloc(sheetW * sheetH * 4, 0);
  const rects = [];

  for (let d = 0; d < DIRS.length; d++) {
    const dir = DIRS[d];
    const r0 = walkMeta.rects.find((q) => q.dir === dir && (q.frame ?? 0) === 0);
    if (!r0) throw new Error(`walk saknar ${dir} f0`);
    const crop = cropRgba(src, sw, sh, r0.x, r0.y, r0.w, r0.h);
    for (let f = 0; f < nFrame; f++) {
      const frameBuf = Buffer.from(crop);
      if (f === 1) {
        const shifted = Buffer.alloc(FW * FH * 4, 0);
        for (let row = 0; row < FH; row++) {
          const sr = row - 1;
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
  await sharp(out, { raw: { width: sheetW, height: sheetH, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(HERO, outPng));

  writeJson('riddare_idle_8dir.json', {
    image: outPng,
    frameW: FW,
    frameH: FH,
    anchor: [ax, ay],
    dirs: DIRS,
    frames: nFrame,
    fps: 2,
    loop: true,
    rects,
  });
}

async function addAlignFields(jsonName, walkMeta, refFootX, refFootY) {
  const meta = readJson(jsonName);
  const { data, w: sw, h: sh } = await loadRgba(path.join(HERO, meta.image));
  const walkAx = walkMeta.anchor[0];
  const walkAy = walkMeta.anchor[1];
  const ax = meta.anchor[0];
  const ay = meta.anchor[1];
  const targetX = refFootX.map((x) => x - walkAx);
  const targetY = refFootY.map((y) => y - walkAy);
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
      rowX.push(Math.round(targetX[d] - (footX - ax)));
      rowY.push(Math.round(targetY[d] - (footY - ay)));
    }
    alignX.push(rowX);
    alignY.push(rowY);
  }
  meta.alignX = alignX;
  meta.alignY = alignY;
  delete meta.imageWebp;
  writeJson(jsonName, meta);
}

/** Efter justering: |(foot−anchor)+align − (refFoot−walkAnchor)| ska vara liten. */
async function verifyAlign(jsonName, walkMeta, refFootX, refFootY, maxErr, attackLoose) {
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
      const limit = jsonName.includes('attack') && f >= (meta.hitFrame ?? 3) ? attackLoose : maxErr;
      const r = meta.rects.find((q) => meta.dirs.indexOf(q.dir) === d && (q.frame ?? 0) === f);
      const crop = cropRgba(data, sw, sh, r.x, r.y, r.w, r.h);
      const { footX, footY } = footMetrics(crop, r.w, r.h);
      const adjX = footX - ax + (meta.alignX[d][f] ?? 0);
      const adjY = footY - ay + (meta.alignY[d][f] ?? 0);
      const err = Math.max(Math.abs(adjX - (refFootX[d] - walkAx)), Math.abs(adjY - (refFootY[d] - walkAy)));
      if (err > worst) {
        worst = err;
        worstAt = `${jsonName} ${meta.dirs[d]} f${f}`;
      }
      if (err > limit) throw new Error(`align-fel ${err}px > ${limit} @ ${worstAt}`);
    }
  }
  return { worst, worstAt };
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

  const allJson = ['riddare_idle_8dir.json', ...sheets];
  for (const s of allJson) await addAlignFields(s, walkMeta, refFootX, refFootY);

  const report = [];
  for (const s of allJson) {
    const { worst, worstAt } = await verifyAlign(s, walkMeta, refFootX, refFootY, 3, 8);
    report.push({ sheet: s, worst, worstAt });
  }
  console.log('Align verify (max residual px):', JSON.stringify(report));

  for (const f of fs.readdirSync(HERO).filter((n) => n.endsWith('.webp'))) fs.unlinkSync(path.join(HERO, f));

  for (const f of fs.readdirSync(HERO).filter((n) => n.endsWith('.png'))) {
    const p = path.join(HERO, f);
    const tmp = p + '.tmp';
    await sharp(p).png({ compressionLevel: 9 }).toFile(tmp);
    try {
      const { execSync } = await import('node:child_process');
      execSync(`pngquant --quality=45-78 --speed 1 --force --output "${p}" "${tmp}"`, { stdio: 'ignore' });
    } catch {
      fs.renameSync(tmp, p);
    }
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }

  let pngSum = 0;
  for (const f of fs.readdirSync(HERO).filter((n) => n.endsWith('.png'))) {
    const sz = fs.statSync(path.join(HERO, f)).size;
    pngSum += sz;
    console.log(`  ${f}: ${(sz / 1024).toFixed(0)} KiB`);
  }
  console.log(`  PNG totalt: ${(pngSum / 1024 / 1024).toFixed(2)} MiB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
