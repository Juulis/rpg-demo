// Karta (issue #6): Tab växlar en överlagrad karta, liten minikarta i hörnet och fog of war per hjälte.
// All geometri läses ur spelets egen state (window.__rpg.zone/hero) och data/portal_by.json – inget hårdkodat.
const ZONE_NAME = { forest: 'Den dimmiga skogen', village: 'Den gamla byn' };
const AREA_NAME = { portalgladet: 'Portalgläntan', byporten: 'Byporten', torget: 'Torget', vasterhus: 'Västerhusen', osterhus: 'Österhusen', kyrkogarden: 'Kyrkogården', benkungens_kapell: 'Benkungens kapell' };
const CELL = 2, FOG_R = 11, GRID = 64, HALF = GRID * CELL / 2; // fog-rutnät 64x64 rutor à 2 enheter (täcker ±64)

let R = null, PB = null, open = false, fog = {}, fogKey = '', dirty = false, lastSave = 0;
const big = document.createElement('canvas'), mini = document.createElement('canvas');
big.id = 'karta'; mini.id = 'minikarta';
Object.assign(big.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: 4, display: 'none', pointerEvents: 'none' });
Object.assign(mini.style, { position: 'fixed', top: '150px', right: '16px', width: '150px', height: '150px', zIndex: 3, display: 'none', pointerEvents: 'none', border: '1px solid #4a6a7a', borderRadius: '8px', background: '#0d0f12cc' });
document.body.append(big, mini);
fetch('data/portal_by.json').then(r => r.json()).then(d => PB = d).catch(() => {});

// --- event-buss: minimal fallback, skapas bara om spelet inte redan har on/emit ---
function ensureBus(r) {
  if (typeof r.on === 'function' && typeof r.emit === 'function') return;
  const L = {};
  try {
    if (typeof r.on !== 'function') r.on = (ev, fn) => { (L[ev] = L[ev] || []).push(fn); return () => { L[ev] = L[ev].filter(f => f !== fn); }; };
    if (typeof r.emit !== 'function') r.emit = (ev, ...a) => { (L[ev] || []).forEach(f => { try { f(...a); } catch (e) { console.warn(e); } }); };
  } catch (e) { /* objektet kan vara låst – kartan fungerar ändå via polling */ }
}

// --- fog of war ---
const heroId = () => R?.state?.cls?.id || 'okand';
const zoneKey = z => z?.name || 'okand';
function fogFor(z) {
  const k = zoneKey(z); if (fog[k]) return fog[k];
  const g = new Uint8Array(GRID * GRID);
  try { const s = localStorage.getItem(`rpg_karta_${heroId()}_${k}`); if (s) { const b = atob(s); for (let i = 0; i < g.length && i < b.length; i++) g[i] = b.charCodeAt(i); } } catch (e) {}
  return fog[k] = g;
}
function saveFog(force) {
  if (!dirty || (!force && performance.now() - lastSave < 2000)) return;
  lastSave = performance.now(); dirty = false;
  try { for (const k in fog) { let s = ''; for (const v of fog[k]) s += String.fromCharCode(v); localStorage.setItem(`rpg_karta_${heroId()}_${k}`, btoa(s)); } } catch (e) {}
}
function reveal(z, x, y) {
  const g = fogFor(z), cx = Math.floor((x + HALF) / CELL), cy = Math.floor((y + HALF) / CELL), r = Math.ceil(FOG_R / CELL);
  for (let j = cy - r; j <= cy + r; j++) for (let i = cx - r; i <= cx + r; i++) {
    if (i < 0 || j < 0 || i >= GRID || j >= GRID || g[j * GRID + i]) continue;
    if (Math.hypot(i + 0.5 - (x + HALF) / CELL, j + 0.5 - (y + HALF) / CELL) * CELL <= FOG_R) { g[j * GRID + i] = 1; dirty = true; }
  }
}

// --- data ur zonen ---
function bounds(z) {
  if (z.rect) return [z.rect[0] - 3, z.rect[0] - 3, z.rect[1] + 3, z.rect[1] + 3];
  const c = z.circle || 45; return [-c - 3, -c - 3, c + 3, c + 3];
}
const T = (tx, ty) => [(tx - 15.5) * 2, (ty - 15.5) * 2]; // samma rutsystem som game.js (32x32 rutor, 1 ruta = 2 enheter)

function draw(cv, opts) {
  const z = R?.zone, h = R?.hero; if (!z || !h) return;
  const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const px = h.position.x, pz = h.position.z;
  let [x0, y0, x1, y1] = bounds(z), s, ox, oy;
  if (opts.mini) { const view = 26; s = Math.min(W, H) / (view * 2); ox = W / 2 - px * s; oy = H / 2 - pz * s; }
  else {
    c.fillStyle = '#0d0f12d9'; c.fillRect(0, 0, W, H);
    const pad = 70; s = Math.min((W - pad * 2) / (x1 - x0), (H - pad * 2 - 40) / (y1 - y0)); ox = W / 2 - (x0 + x1) / 2 * s; oy = H / 2 + 20 - (y0 + y1) / 2 * s;
  }
  const X = x => ox + x * s, Y = y => oy + y * s;
  c.save();
  if (opts.mini) { c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, 7); c.clip(); }
  // terräng
  if (z.circle) { c.fillStyle = '#1f2a1f'; c.beginPath(); c.arc(X(0), Y(0), z.circle * s, 0, 7); c.fill(); c.strokeStyle = '#3d4430'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#2a3526'; c.beginPath(); c.arc(X(0), Y(0), 12 * s, 0, 7); c.fill(); }
  if (z.rect) { const [a, b] = z.rect; c.fillStyle = '#2b2e2c'; c.fillRect(X(a), Y(a), (b - a) * s, (b - a) * s); c.strokeStyle = '#4a4e54'; c.lineWidth = 2; c.strokeRect(X(a), Y(a), (b - a) * s, (b - a) * s);
    c.fillStyle = '#383c40'; c.fillRect(X(-1), Y(-24), 4 * s, 54 * s); c.fillRect(X(-25), Y(2.5), 50 * s, 3 * s); // vägar (som i buildVillage)
    if (PB?.village?.zones) for (const q of PB.village.zones) { const [ax, ay] = T(...q.tiles[0]), [bx, by] = T(...q.tiles[1]);
      c.strokeStyle = q.boss_arena ? '#c0182a99' : q.safe ? '#f2c46b88' : '#4a6a7a88'; c.setLineDash([4, 4]); c.lineWidth = 1; c.strokeRect(X(ax - 1), Y(ay - 1), (bx - ax + 2) * s, (by - ay + 2) * s); c.setLineDash([]);
      if (!opts.mini) { c.fillStyle = z.cleared?.[q.id] ? '#9fc4d4' : '#8a8f96'; c.font = '13px Cinzel, Georgia, serif'; c.textAlign = 'center'; c.fillText((AREA_NAME[q.id] || q.id) + (z.cleared?.[q.id] ? ' ✓' : ''), X((ax + bx) / 2), Y(ay) + 14); } } }
  // hinder (träd, stenar, hus, murar) från colliders
  for (const k of z.colliders || []) { if (k.off) continue; c.fillStyle = k.r > 1.4 ? '#5a5650' : '#14201a'; c.beginPath(); c.arc(X(k.x), Y(k.z), Math.max(1, k.r * s), 0, 7); c.fill(); }
  // runstenar
  for (const r of z.runes || []) { c.fillStyle = r.active ? '#7fb8d8' : '#50565e'; c.strokeStyle = '#9fd0e8'; c.lineWidth = 1; c.beginPath(); c.moveTo(X(r.x), Y(r.z) - 7); c.lineTo(X(r.x) + 5, Y(r.z)); c.lineTo(X(r.x), Y(r.z) + 7); c.lineTo(X(r.x) - 5, Y(r.z)); c.closePath(); c.fill(); c.stroke(); }
  // portaler
  for (const p of z.portals || []) { c.strokeStyle = '#ff3344'; c.fillStyle = '#c0182a88'; c.lineWidth = 2; c.beginPath(); c.arc(X(p.x), Y(p.z), Math.max(5, 1.4 * s), 0, 7); c.fill(); c.stroke();
    if (!opts.mini) { c.fillStyle = '#ff7080'; c.font = '13px Cinzel, Georgia, serif'; c.textAlign = 'center'; c.fillText(p.target === 'village' ? 'Portal → Den gamla byn' : 'Portal → Skogen', X(p.x), Y(p.z) - Math.max(9, 1.4 * s + 6)); } }
  // fog of war
  const g = fogFor(z); c.fillStyle = opts.mini ? '#0d0f12' : '#0b0c0ee0';
  for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) if (!g[j * GRID + i]) { const wx = i * CELL - HALF, wy = j * CELL - HALF; if (wx + CELL < x0 || wy + CELL < y0 || wx > x1 || wy > y1) continue; c.fillRect(Math.floor(X(wx)), Math.floor(Y(wy)), Math.ceil(CELL * s) + 1, Math.ceil(CELL * s) + 1); }
  // spelare + riktning (fwd = sin/cos av rotation.y, samma som game.js)
  const a = h.rotation.y, fx = Math.sin(a), fz = Math.cos(a), sz = opts.mini ? 7 : 10;
  c.fillStyle = '#f2c46b'; c.strokeStyle = '#000'; c.lineWidth = 1.5; c.beginPath();
  c.moveTo(X(px) + fx * sz, Y(pz) + fz * sz); c.lineTo(X(px) - fx * sz * 0.6 + fz * sz * 0.6, Y(pz) - fz * sz * 0.6 - fx * sz * 0.6); c.lineTo(X(px) - fx * sz * 0.6 - fz * sz * 0.6, Y(pz) - fz * sz * 0.6 + fx * sz * 0.6); c.closePath(); c.fill(); c.stroke();
  c.restore();
  if (!opts.mini) {
    c.textAlign = 'center'; c.fillStyle = '#e8d8c8'; c.font = '700 30px Cinzel, Georgia, serif'; c.shadowColor = '#c0182a88'; c.shadowBlur = 14; c.fillText(ZONE_NAME[z.name] || z.name, W / 2, 46); c.shadowBlur = 0;
    c.fillStyle = '#9fc4d4'; c.font = '13px Cinzel, Georgia, serif'; c.fillText('Tab: stäng karta · ◆ runsten · ● portal · ▲ du', W / 2, H - 22);
  } else { c.strokeStyle = '#4a6a7a'; c.lineWidth = 1; c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, 7); c.stroke(); c.fillStyle = '#9fc4d4'; c.font = '10px Cinzel, Georgia, serif'; c.textAlign = 'center'; c.fillText('N', W / 2, 11); }
}

function toggle(force) { open = force ?? !open; big.style.display = open ? 'block' : 'none'; if (open) draw(big, {}); R?.emit?.('map_toggle', open); }
addEventListener('keydown', e => {
  if (e.key !== 'Tab' && e.code !== 'Tab') return;
  e.preventDefault(); // fokus får inte hoppa
  if (e.repeat || !R?.state?.playing) return;
  toggle();
}, true);

let lastHero = null;
function loop() {
  requestAnimationFrame(loop);
  if (!R) { if (window.__rpg) { R = window.__rpg; ensureBus(R); R.on?.('zone_enter', () => saveFog(true)); R.map = R.map || { toggle, get open() { return open; } }; } else return; }
  if (heroId() !== lastHero) { saveFog(true); fog = {}; lastHero = heroId(); }
  const z = R.zone, h = R.hero, playing = !!R.state?.playing && !!z;
  mini.style.display = playing ? 'block' : 'none';
  if (!playing) { if (open) toggle(false); return; }
  reveal(z, h.position.x, h.position.z); saveFog(false);
  draw(mini, { mini: true }); if (open) draw(big, {});
}
addEventListener('beforeunload', () => saveFog(true));
loop();
