// Ljudmodul för Runornas kall (issue #5).
// - AudioContext startas vid första användarinteraktion (krav i webbläsare).
// - Ljud: Kenney CC0 (kenney.nl) inbäddade i js/sfx-data.js; syntetiserad reserv om avkodning misslyckas.
// - Lyssnar på window.__rpg.on(evt, fn) (event-bus) samt window-eventet 'sfx' (detail: {name} eller {evt, args}).
import { SFX_DATA } from './sfx-data.js';

const LS_VOL = 'rpg_vol', LS_MUTE = 'rpg_mute';
let vol = clamp(parseFloat(localStorage.getItem(LS_VOL) ?? '0.7'));
let muted = localStorage.getItem(LS_MUTE) === '1';
let ctx = null, master = null;
const buffers = {};

// Ljudnamn -> varianter (slumpas) + basvolym
const SOUNDS = {
  hit: { v: ['hit1', 'hit2'], g: 0.7 },
  kill: { v: ['kill'], g: 0.8 },
  drop: { v: ['drop'], g: 0.6 },
  drop_rare: { v: ['drop_rare'], g: 0.7 },
  pickup: { v: ['pickup'], g: 0.6 },
  pickup_first: { v: ['pickup_first'], g: 0.6 },
  gold: { v: ['gold'], g: 0.6 },
  rune: { v: ['rune'], g: 0.8 },
  portal: { v: ['portal'], g: 0.8 },
  zone: { v: ['zone'], g: 0.6 },
  boss: { v: ['boss'], g: 0.9 },
  step: { v: ['step1', 'step2', 'step3'], g: 0.25 },
  click: { v: ['click'], g: 0.5 },
  toggle: { v: ['toggle'], g: 0.5 },
};

function clamp(x) { return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0.7; }
function applyGain() { if (master) master.gain.setTargetAtTime(muted ? 0 : vol, ctx.currentTime, 0.02); }

function b64ToBuf(b64) { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }

function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination); master.gain.value = muted ? 0 : vol;
  for (const [k, b64] of Object.entries(SFX_DATA)) ctx.decodeAudioData(b64ToBuf(b64)).then(b => { buffers[k] = b; }, () => {});
}

// Enkel syntetiserad reserv (t.ex. webbläsare utan OGG-stöd)
function synth(name, rate, gain) {
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  const p = { hit: [180, 'square', 0.08], kill: [110, 'sawtooth', 0.25], step: [80, 'triangle', 0.05], gold: [1400, 'triangle', 0.12],
    rune: [520, 'sine', 0.8], portal: [300, 'sine', 0.7], boss: [70, 'sawtooth', 0.5], drop_rare: [880, 'sine', 0.3] }[name] || [660, 'sine', 0.12];
  o.type = p[1]; o.frequency.setValueAtTime(p[0] * rate, t); if (name === 'portal') o.frequency.exponentialRampToValueAtTime(900, t + p[2]);
  g.gain.setValueAtTime(0.3 * gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + p[2]);
  o.connect(g).connect(master); o.start(t); o.stop(t + p[2] + 0.02);
}

export function play(name, opts = {}) {
  if (!ctx || muted || vol <= 0) return;
  if (ctx.state === 'suspended') ctx.resume();
  const s = SOUNDS[name]; if (!s) return;
  const rate = (opts.rate ?? 1) * (1 + (Math.random() * 2 - 1) * (opts.vary ?? 0.06));
  const gain = s.g * (opts.gain ?? 1);
  const buf = buffers[s.v[(Math.random() * s.v.length) | 0]];
  if (!buf) return synth(name, rate, gain);
  const src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = buf; src.playbackRate.value = rate; g.gain.value = gain;
  src.connect(g).connect(master); src.start();
}

export function setVolume(v) { vol = clamp(v); localStorage.setItem(LS_VOL, String(vol)); if (vol > 0 && muted) setMuted(false); applyGain(); syncUI(); }
export function setMuted(m) { muted = !!m; localStorage.setItem(LS_MUTE, muted ? '1' : '0'); applyGain(); syncUI(); }
export const toggleMute = () => { setMuted(!muted); if (!muted) play('toggle'); };
export const getVolume = () => vol, isMuted = () => muted;

// ---------- event -> ljud ----------
let lastStep = 0, lastHit = 0;
const HANDLERS = {
  hit: () => { const n = performance.now(); if (n - lastHit > 40) { lastHit = n; play('hit'); } },
  kill: (id) => play(/boss|kung/i.test(String(id ?? '')) ? 'boss' : 'kill'),
  loot_drop: (q) => play(['rare', 'set', 'legendary', 'unique'].includes(q) ? 'drop_rare' : 'drop', { rate: q === 'legendary' ? 0.8 : 1 }),
  pickup: (id, first) => play(first ? 'pickup_first' : 'pickup'),
  gold: () => play('gold'),
  rune: (n) => play('rune', { rate: 1 + 0.12 * Math.max(0, (Number(n) || 1) - 1), vary: 0 }),
  portal_open: () => play('portal', { vary: 0 }),
  zone_enter: () => play('zone'),
  boss_phase: () => play('boss', { rate: 0.85 }),
  step: () => { const n = performance.now(); if (n - lastStep > 320) { lastStep = n; play('step', { vary: 0.1 }); } },
};
function onEvent(evt, ...args) { const h = HANDLERS[evt]; if (h) h(...args); else if (SOUNDS[evt]) play(evt); }

// Koppla till window.__rpg-bussen; skapa en minimal kompatibel buss (on/emit) om den saknas.
let hooked = null;
function ensureBus() {
  const r = window.__rpg || (window.__rpg = {});
  if (r === hooked) return;
  if (typeof r.on !== 'function') {
    const ls = {};
    r.on = (e, fn) => { (ls[e] ||= []).push(fn); return () => { ls[e] = ls[e].filter(f => f !== fn); }; };
    r.emit = (e, ...a) => { for (const fn of ls[e] || []) { try { fn(...a); } catch (err) { console.error(err); } } };
  }
  for (const e of Object.keys(HANDLERS)) r.on(e, (...a) => onEvent(e, ...a));
  hooked = r;
}
ensureBus();
setInterval(ensureBus, 1500); // om game.js ersätter window.__rpg senare

addEventListener('sfx', (e) => { const d = e.detail || {}; if (typeof d === 'string') onEvent(d); else if (d.evt) onEvent(d.evt, ...(d.args || [])); else if (d.name) play(d.name, d); });

// ---------- upplåsning + tangent M ----------
const unlockOnce = () => unlock();
['pointerdown', 'keydown', 'touchstart'].forEach(t => addEventListener(t, unlockOnce, { capture: true, passive: true }));
document.getElementById('startBtn')?.addEventListener('click', () => { unlock(); ensureBus(); play('click'); });

addEventListener('keydown', (e) => {
  if (e.code !== 'KeyM' || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
  const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  toggleMute();
});

// ---------- UI: volymreglage i #plate ----------
let ui = null;
function syncUI() { if (!ui) return; ui.btn.textContent = muted || vol === 0 ? '🔇' : '🔊'; ui.range.value = String(Math.round(vol * 100)); ui.btn.title = muted ? 'Ljud av (M)' : 'Ljud på (M)'; }
function buildUI() {
  const plate = document.getElementById('plate'); if (!plate) return;
  const wrap = document.createElement('span'); wrap.id = 'sfxCtl';
  wrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px';
  const btn = document.createElement('button'); btn.type = 'button';
  btn.style.cssText = 'font-size:12px;padding:2px 6px;border-color:#6b5a3e;background:#2a2420';
  const range = document.createElement('input'); range.type = 'range'; range.min = '0'; range.max = '100'; range.step = '5';
  range.setAttribute('aria-label', 'Volym'); range.title = 'Volym'; range.style.cssText = 'width:70px;accent-color:#f2c46b';
  btn.addEventListener('click', (e) => { e.stopPropagation(); unlock(); toggleMute(); btn.blur(); });
  range.addEventListener('input', () => { unlock(); setVolume(range.value / 100); });
  range.addEventListener('change', () => { play('click'); range.blur(); });
  // hindra att klick i reglaget når spelets canvas-/klickhantering
  for (const t of ['pointerdown', 'mousedown', 'click']) wrap.addEventListener(t, e => e.stopPropagation());
  wrap.append(btn, range); plate.appendChild(wrap); ui = { btn, range }; syncUI();
}
if (document.readyState === 'loading') addEventListener('DOMContentLoaded', buildUI); else buildUI();

window.__audio = { play, setVolume, setMuted, toggleMute, getVolume, isMuted };
