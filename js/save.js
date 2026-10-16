// Autosparning + hjälteval (issue #9).
// - Varje hjälte har en egen sparfil i localStorage: 'rpg_hero_<id>' ({version, hero, game}), index i 'rpg_heroes',
//   och 'rpg_save' = {version, last} pekar på senast spelade hjälte.
// - Sätter window.__rpg.session = {seed, killed:Set} INNAN game.js bygger zoner/spawn (laddas före game.js i index.html).
// - Sparar vid bus-events (kill, pickup, loot_drop, gold, rune, zone_enter, portal_open, new_game, boss_phase),
//   vid ändring av hjältens state (XP/nivå/guld/väska/utrustning/runor/zon/lorebok, kollas varje sekund),
//   var 10:e sekund under spel samt vid beforeunload/visibilitychange.
// Kräver inga ändringar i spelets logik; använder bara window.__rpg (state, hero, zone, newGame, setLevel, activateAll, enterPortal).
import { GFX } from './menu-data.js';
export const SAVE_VERSION = 1;
const K_INDEX = 'rpg_heroes', K_LAST = 'rpg_save', heroKey = id => 'rpg_hero_' + id;
const MAX_HEROES = 8;
const CLASSES = [['amazonkrigare', 'Amazonkrigare', '🔱'], ['barbar', 'Barbar', '💥'], ['riddare', 'Riddare', '🛡️']];
const CLS_NAME = Object.fromEntries(CLASSES.map(c => [c[0], c[1]])), CLS_ICON = Object.fromEntries(CLASSES.map(c => [c[0], c[2]]));
// Porträtt: inbäddad grafik från js/menu-data.js; kan bytas genom att sätta window.__rpg.portraits = {klass: url}. Fallback = CSS-figur.
export const portraitSrc = cls => window.__rpg?.portraits?.[cls] || GFX[cls] || '';

// ---------- buss (kompatibel med PR #8 / Utvecklarens buss) ----------
const R = window.__rpg || (window.__rpg = {});
if (typeof R.on !== 'function' || typeof R.emit !== 'function') {
  const ls = {};
  R.on = (e, fn) => { (ls[e] ||= []).push(fn); return () => { ls[e] = ls[e].filter(f => f !== fn); }; };
  R.emit = (e, ...a) => { for (const fn of ls[e] || []) { try { fn(...a); } catch (err) { console.error(err); } } };
}
export const newSeed = () => (Math.random() * 0x7fffffff) >>> 0 || 1;

// ---------- lagring ----------
const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { console.warn('Sparning misslyckades', e); return false; } };
export function migrate(d) {
  if (!d || typeof d !== 'object') return null;
  if (!d.version) { // v0: platt objekt {cls, level, xp, gold, inv, equip, seed, killed, ...} -> v1
    d = { version: 1, hero: { id: d.id, name: d.name, cls: d.cls, level: d.level || 1, xp: d.xp || 0, gold: d.gold || 0, inv: d.inv || [], equip: d.equip || {} },
      game: d.seed ? { seed: d.seed, killed: d.killed || [], zone: d.zone || 'forest', pos: d.pos || null, stage: d.stage || 0, runes: d.runes || 0, city: d.city || 'besatt' } : null };
  }
  if (d.version > SAVE_VERSION) return null; // nyare format än koden förstår
  // framtida: if (d.version === 1) { ...; d.version = 2; }
  d.hero.inv ||= []; d.hero.equip ||= {}; if (d.game) d.game.killed = Array.isArray(d.game.killed) ? d.game.killed : [...(d.game.killed || [])];
  return d;
}
export const listHeroes = () => (read(K_INDEX) || []).filter(h => h && h.id);
const writeIndex = l => write(K_INDEX, l);
export const loadHero = id => migrate(read(heroKey(id)));
export function validName(name, ignoreId) {
  const n = (name || '').trim();
  if (n.length < 2 || n.length > 16) return 'Namnet måste vara 2–16 tecken.';
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(n)) return 'Bara bokstäver, siffror, mellanslag, - och _.';
  if (listHeroes().some(h => h.id !== ignoreId && h.name.toLowerCase() === n.toLowerCase())) return 'Det finns redan en hjälte med det namnet.';
  return '';
}
export function createHero(name, cls) {
  const err = validName(name); if (err) throw new Error(err);
  if (listHeroes().length >= MAX_HEROES) throw new Error('Alla hjälteplatser är upptagna.');
  const id = 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const d = { version: SAVE_VERSION, hero: { id, name: name.trim(), cls, level: 1, xp: 0, gold: 0, inv: [], equip: {}, fresh: true }, game: null, savedAt: Date.now() };
  write(heroKey(id), d); writeIndex([...listHeroes(), { id, name: d.hero.name, cls, level: 1, savedAt: d.savedAt }]);
  return d;
}
export function deleteHero(id) {
  localStorage.removeItem(heroKey(id)); writeIndex(listHeroes().filter(h => h.id !== id));
  if (read(K_LAST)?.last === id) localStorage.removeItem(K_LAST);
  if (cur?.hero.id === id) cur = null;
}

// ---------- aktuell hjälte + session ----------
let cur = null, playing = false, lastSig = '';
function setSession(game) { R.session = { seed: game.seed, killed: new Set(game.killed || []) }; }
const foundCount = () => Object.keys(read('rpg_found') || {}).length;
function snapshot() {
  const S = R.state, Z = R.zone, h = R.hero; if (!S || !cur || !S.cls) return null;
  const s = R.session || {};
  cur.hero = { ...cur.hero, cls: S.cls.id, level: S.level, xp: S.xp, gold: S.gold, inv: S.inv, equip: S.equip, fresh: false };
  cur.game = { seed: s.seed ?? cur.game?.seed ?? newSeed(), killed: [...(s.killed || cur.game?.killed || [])],
    zone: Z?.name || cur.game?.zone || 'forest', pos: h ? [+h.position.x.toFixed(2), +h.position.z.toFixed(2)] : null, rot: h ? +h.rotation.y.toFixed(3) : 0,
    stage: S.stage, runes: S.runes, city: S.city };
  cur.found = foundCount(); cur.version = SAVE_VERSION; cur.savedAt = Date.now();
  return cur;
}
const sig = () => { const S = R.state; return S ? JSON.stringify([S.level, S.xp, S.gold, S.stage, S.runes, S.city, R.zone?.name, S.inv.length, S.inv.map(i => i.n || 1).join(), Object.values(S.equip).map(i => i?.base || '').join(), R.session?.killed?.size, foundCount()]) : ''; };
export function saveNow(reason = '') {
  if (!playing || !snapshot()) return false;
  if (!write(heroKey(cur.hero.id), cur)) return false;
  writeIndex(listHeroes().map(x => x.id === cur.hero.id ? { ...x, cls: cur.hero.cls, level: cur.hero.level, savedAt: cur.savedAt } : x));
  write(K_LAST, { version: SAVE_VERSION, last: cur.hero.id }); lastSig = sig(); showIcon(); R.lastSave = { reason, at: cur.savedAt };
  return true;
}
let pend = 0; const saveSoon = reason => { clearTimeout(pend); pend = setTimeout(() => saveNow(reason), 150); };
for (const e of ['kill', 'pickup', 'loot_drop', 'gold', 'rune', 'zone_enter', 'portal_open', 'boss_phase', 'level', 'xp', 'equip', 'lore_unlock']) R.on(e, () => saveSoon(e));
R.on('new_game', o => { if (cur && o?.seed != null) { cur.game = { ...(cur.game || {}), seed: o.seed, killed: [] }; if (!R.session) R.session = { seed: o.seed, killed: new Set() }; } saveSoon('new_game'); });
setInterval(() => { if (playing && sig() !== lastSig) saveNow('change'); }, 1000);
setInterval(() => { if (playing) saveNow('interval'); }, 10000);
addEventListener('beforeunload', () => saveNow('beforeunload'));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow('hidden'); });

// ---------- sparikon ----------
const css = document.createElement('style');
css.textContent = `#saveIcon{position:fixed;right:14px;top:12px;z-index:30;width:24px;height:24px;background:url(${GFX.save}) center/contain no-repeat;opacity:0;transition:opacity .3s;pointer-events:none;filter:drop-shadow(0 0 4px #000)}#saveIcon.on{opacity:.95}
#heroMenu{background:#000 url(${GFX.bg}) center/cover;justify-content:flex-start;gap:8px;overflow:auto}
#heroMenu .titel{width:min(34vw,420px);margin-top:1vh;filter:drop-shadow(0 0 18px rgba(192,24,42,.35))}
#heroMenu .rubrik{font:26px Cinzel,serif;color:#e6dfcc;letter-spacing:2px;margin:2px 0}
#heroSlots{display:grid;grid-template-columns:repeat(2,min(44vw,420px));gap:6px 14px}
.hslot{position:relative;height:76px;background:url(${GFX.plats}) 0 0/100% 100% no-repeat;cursor:pointer;text-align:left;color:#cbb994}
.hslot .portrait{position:absolute;left:7.8%;top:23.6%;width:9.96%;height:52.1%;border:0;background:#120f0b;font-size:20px}
.hslot .info{position:absolute;left:24%;top:50%;transform:translateY(-50%)}
.hslot b{display:block;color:#efe7d2;font:20px Cinzel,serif}.hslot small{font-size:13px;color:#a89a80}
.hslot.sel{filter:drop-shadow(0 0 10px rgba(199,163,90,.8))}.hslot.sel b{color:#e0b060}
.hslot.empty{background-image:url(${GFX.tom});cursor:default}
.portrait{width:48px;height:48px;flex:none;position:relative;display:flex;align-items:center;justify-content:center;font-size:26px;overflow:hidden;background:radial-gradient(#3a3226,#120f0b)}
.portrait img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#heroMenu .btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:center;margin-top:8px}
#heroMenu button{border-style:solid;border-width:16px 44px;border-image:url(${GFX.knapp}) 20 60 fill / 16px 44px stretch;background:none;color:#e6dfcc;font:18px Cinzel,serif;padding:0 6px;min-width:170px;cursor:pointer;text-shadow:0 1px 2px #000;box-shadow:none;border-radius:0}
#heroMenu button:hover:not(:disabled){color:#fff;filter:brightness(1.25) drop-shadow(0 0 6px rgba(199,163,90,.5))}#heroMenu button:disabled{opacity:.4;cursor:default}
#heroNew{display:flex;flex-direction:column;gap:10px;align-items:center}#heroNew .clsrow{display:flex;gap:22px}
#heroNew .clsbtn{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;opacity:.6;color:#cbb994;font:18px Cinzel,serif}
#heroNew .clsbtn .portrait{width:120px;height:120px;border:3px solid #3a3f45}#heroNew .clsbtn.sel{opacity:1;color:#e0b060}#heroNew .clsbtn.sel .portrait{border-color:#c7a35a;box-shadow:0 0 24px 4px rgba(199,163,90,.5)}
#heroName{width:400px;height:56px;box-sizing:border-box;border-style:solid;border-width:16px 44px;border-image:url(${GFX.textfalt}) 20 55 fill / 16px 44px stretch;background:none;color:#e6dfcc;font:18px Cinzel,serif;text-align:center;outline:none}
#heroErr{color:#e06060;min-height:18px;font-size:14px;text-shadow:0 1px 2px #000}`;
document.head.appendChild(css);
const icon = document.createElement('div'); icon.id = 'saveIcon'; icon.title = 'Sparat';
let iconT; function showIcon() { if (!icon.isConnected) document.body.appendChild(icon); icon.classList.add('on'); clearTimeout(iconT); iconT = setTimeout(() => icon.classList.remove('on'), 900); }

// ---------- start: ny/fortsätt ----------
const ready = () => new Promise(res => { const t = setInterval(() => { if (typeof R.newGame === 'function' && R.state) { clearInterval(t); res(); } }, 50); });
const wait = ms => new Promise(r => setTimeout(r, ms));
async function startHero(d, cont) {
  await ready(); cur = d; playing = false;
  const h = d.hero, g = cont && d.game ? d.game : { seed: newSeed(), killed: [], zone: 'forest', pos: null, stage: 0, runes: 0, city: 'besatt' };
  if (!cont) d.game = g;
  setSession(g); // spawnen läser denna innan zonerna byggs
  // game.js newGame() läser utrustning/väska/guld via inv.load() från 'rk_inv_<klass>' – lägg hjältens data där först.
  if (!h.fresh) write('rk_inv_' + h.cls, { inv: h.inv, equip: h.equip, gold: h.gold }); else localStorage.removeItem('rk_inv_' + h.cls);
  hideMenu(); R.newGame(h.cls);
  const S = R.state;
  if (!h.fresh) { R.setLevel?.(h.level); S.xp = h.xp; }
  if (cont) { S.stage = g.stage || 0; S.runes = g.runes || 0; S.city = g.city || 'besatt'; if (S.city === 'rensad') localStorage.setItem('rk_stad_gamla_byn', 'rensad'); }
  await wait(1300); // newGame -> enterZone('forest') har tonat in
  if (cont) {
    if ((g.stage || 0) >= 1 && R.zone?.runes) { const st = S.stage; R.activateAll?.(); S.stage = Math.max(st, 1); S.runes = 3; }
    if (g.zone === 'village') { R.enterPortal(); await wait(1300); S.stage = Math.max(S.stage, g.stage || 0); }
    if (g.pos && R.hero) { R.hero.position.set(g.pos[0], 0, g.pos[1]); R.hero.rotation.y = g.rot || 0; }
  }
  playing = true; saveNow('start');
}

// ---------- startmeny ----------
let menu, sel = null;
function portrait(cls) { return `<div class="portrait">${CLS_ICON[cls] || '❔'}${portraitSrc(cls) ? `<img src="${portraitSrc(cls)}" alt="">` : ''}</div>`; }
function hideMenu() { menu?.classList.add('hidden'); document.getElementById('start')?.classList.add('hidden'); }
export function showMenu() {
  playing && saveNow('menu'); playing = false;
  document.getElementById('start')?.classList.add('hidden');
  if (!menu) { menu = document.createElement('div'); menu.id = 'heroMenu'; menu.className = 'overlay'; document.body.appendChild(menu);
    menu.addEventListener('keydown', e => e.stopPropagation()); menu.addEventListener('keyup', e => e.stopPropagation()); }
  menu.classList.remove('hidden');
  const hs = listHeroes(); if (!hs.some(h => h.id === sel)) sel = read(K_LAST)?.last && hs.some(h => h.id === read(K_LAST).last) ? read(K_LAST).last : hs[0]?.id || null;
  const d = sel && loadHero(sel);
  const slots = Array.from({ length: MAX_HEROES }, (_, i) => { const h = hs[i]; return h ? `<div class="hslot${h.id === sel ? ' sel' : ''}" data-id="${h.id}">${portrait(h.cls)}<div class="info"><b>${esc(h.name)}</b><small>${CLS_NAME[h.cls] || h.cls} · Nivå ${h.level || 1}</small></div></div>` : `<div class="hslot empty"></div>`; }).join('');
  menu.innerHTML = `<img class="titel" src="${GFX.titel}" alt="Runornas kall"><div class="rubrik">Välj hjälte</div><div class="hm"><div id="heroSlots">${slots}</div></div>
    <div class="btns"><button id="hmCont" ${d?.game ? '' : 'disabled'}>Fortsätt</button><button id="hmNewGame" ${d ? '' : 'disabled'}>Nytt game</button>
    <button id="hmNewHero" ${hs.length < MAX_HEROES ? '' : 'disabled'}>Ny hjälte</button><button id="hmDel" ${d ? '' : 'disabled'}>Radera hjälte</button></div>`;
  menu.querySelectorAll('.hslot[data-id]').forEach(el => { el.onclick = () => { sel = el.dataset.id; showMenu(); }; el.ondblclick = () => { const x = loadHero(el.dataset.id); if (x) startHero(x, !!x.game); }; });
  menu.querySelector('#hmCont').onclick = () => d?.game && startHero(d, true);
  menu.querySelector('#hmNewGame').onclick = () => d && startHero(d, false);
  menu.querySelector('#hmNewHero').onclick = newHeroForm;
  menu.querySelector('#hmDel').onclick = () => { if (!d) return; const h = d.hero; menu.querySelector('.btns').innerHTML = `<span>Radera ${esc(h.name)} för alltid?</span><button id="hmYes">Ja, radera</button><button id="hmNo">Avbryt</button>`;
    menu.querySelector('#hmYes').onclick = () => { deleteHero(h.id); sel = null; showMenu(); }; menu.querySelector('#hmNo').onclick = showMenu; };
}
function newHeroForm() {
  let cls = 'riddare';
  menu.innerHTML = `<img class="titel" src="${GFX.titel}" alt="Runornas kall"><div class="rubrik">Ny hjälte</div><div id="heroNew"><div class="clsrow">${CLASSES.map(([id, n]) => `<div class="clsbtn${id === cls ? ' sel' : ''}" data-c="${id}">${portrait(id)}<span>${n}</span></div>`).join('')}</div>
    <input id="heroName" maxlength="16" placeholder="Namn (2–16 tecken)" autocomplete="off"><div id="heroErr"></div>
    <div class="btns"><button id="hnOk">Skapa och spela</button><button id="hnBack">Tillbaka</button></div></div>`;
  const inp = menu.querySelector('#heroName'), err = menu.querySelector('#heroErr');
  menu.querySelectorAll('.clsbtn').forEach(el => el.onclick = () => { cls = el.dataset.c; menu.querySelectorAll('.clsbtn').forEach(x => x.classList.toggle('sel', x === el)); });
  inp.oninput = () => err.textContent = inp.value.trim().length >= 2 ? validName(inp.value) : '';
  const ok = () => { const e = validName(inp.value); if (e) { err.textContent = e; return; } try { const d = createHero(inp.value, cls); sel = d.hero.id; startHero(d, false); } catch (x) { err.textContent = x.message; } };
  inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
  menu.querySelector('#hnOk').onclick = ok; menu.querySelector('#hnBack').onclick = showMenu; inp.focus();
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Engångsimport: äldre 'rk_inv_<klass>'-sparningar blir hjältar om inga hjältar finns.
if (!listHeroes().length && !read(K_INDEX)) { writeIndex([]);
  for (const [id, n] of CLASSES) { const o = read('rk_inv_' + id); if (o && Array.isArray(o.inv)) { try { const d = createHero(n, id); Object.assign(d.hero, { inv: o.inv, equip: o.equip || {}, gold: o.gold || 0, fresh: false }); write(heroKey(d.hero.id), d); } catch {} } } }

// Visa menyn i stället för den gamla startskärmen (även när 'Spela igen' visar #start).
function hook() {
  const st = document.getElementById('start'); if (!st) return;
  new MutationObserver(() => { if (!st.classList.contains('hidden')) showMenu(); }).observe(st, { attributes: true, attributeFilter: ['class'] });
  showMenu();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
Object.assign(R, { save: { saveNow, listHeroes, loadHero, createHero, deleteHero, migrate, showMenu, get current() { return cur; }, get playing() { return playing; } } });
