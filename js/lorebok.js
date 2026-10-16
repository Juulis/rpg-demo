// Lorebok (tangent H, issue #7). Fristående modul: läser data/lorebok.json och visar set och legendariska föremål.
// Upplåsning: en post är upplåst när dess id finns i localStorage 'rpg_found' (game.js skriver första upplocket per id).
// Lyssnar på window.__rpg pickup(itemId, first) och kontrollerar dessutom rpg_found regelbundet, så den fungerar även
// om ingen emit finns. on/emit skapas som minimal fallback bara om de saknas. Ändrar inte game.js.
import { iconHTML } from './icons.js';
import { fmtStat } from './loot.js';
import { LORE_BILDER } from './lorebok-bilder.js';

const FOUND_KEY = 'rpg_found';
const [LORE, SETS, BAS] = await Promise.all(['lorebok', 'set', 'foremal_bas'].map(n => fetch(`data/${n}.json`).then(r => r.json())));
const SETDATA = Object.fromEntries((SETS.sets || []).map(s => [s.id, s]));
const BASNAMN = {}; for (const k of ['weapons', 'armor', 'jewelry']) for (const b of BAS[k] || []) BASNAMN[b.id] = b.name;
const LEGDATA = Object.fromEntries((BAS.legendary || []).map(l => [l.id, l]));

// Alla upplåsbara poster: id -> { name, kind, set?, piece? }. Setdelar kan även komma som "<set>.<bas>".
const POSTER = {}, ALIAS = {};
for (const c of LORE.categories) for (const e of c.entries) {
  if (e.pieces) for (const p of e.pieces) { POSTER[p.id] = { e: p, set: e, cat: c.id }; ALIAS[e.id + '.' + p.base] = p.id; ALIAS[e.id + ':' + p.base] = p.id; }
  else POSTER[e.id] = { e, cat: c.id };
}
const TOTAL = Object.keys(POSTER).length;
const resolve = id => (POSTER[id] ? id : ALIAS[id]) || null;
const readFound = () => { try { return JSON.parse(localStorage.getItem(FOUND_KEY) || '{}') || {}; } catch { return {}; } };
const isFound = (f, id) => !!f[id];
const unlockedSet = f => Object.keys(POSTER).filter(id => isFound(f, id));

// ---------- stil ----------
const css = `
#lorebok{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(5,6,7,.78);font-family:Cinzel,Georgia,serif}
#lorebok.hidden{display:none}
#lorebok .bok{width:min(1060px,96vw);height:min(640px,92vh);display:grid;grid-template-columns:1fr 1fr;gap:0;padding:22px;box-sizing:border-box;
 background:#3b2414;border-radius:10px;border:3px solid #1c0f07;box-shadow:0 0 0 2px #7a5a2e inset,0 12px 40px #000;position:relative}
#lorebok .sida{background:linear-gradient(#e8d7b0,#d9c393);color:#3a2a17;padding:16px 18px;overflow:auto;box-shadow:inset 0 0 30px rgba(80,50,20,.45)}
#lorebok .sida.v{border-radius:4px 0 0 4px;border-right:2px solid #8a6a3a}
#lorebok .sida.h{border-radius:0 4px 4px 0}
#lorebok h2{margin:0 0 6px;font-size:22px;color:#3b2414;display:flex;justify-content:space-between;align-items:baseline}
#lorebok h2 small{font-size:14px;color:#6b5332}
#lorebok .flikar{display:flex;gap:6px;margin-bottom:10px}
#lorebok .flik{flex:1;padding:5px 8px;border:1px solid #8a6a3a;background:#cdb483;color:#3a2a17;font:inherit;font-size:14px;cursor:pointer;border-radius:3px}
#lorebok .flik.on{background:#3b2414;color:#e8d7b0}
#lorebok .grupp{margin:8px 0 2px;font-size:14px;color:#2f6b2a;display:flex;justify-content:space-between}
#lorebok .grupp.las{color:#5a4a33}
#lorebok .rut{display:grid;grid-template-columns:repeat(auto-fill,52px);gap:6px}
#lorebok .post{width:52px;height:52px;border:2px solid #8a6a3a;background:#2b2118;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;border-radius:3px;overflow:hidden}
#lorebok .post.legendary{border-color:#c7a35a}#lorebok .post.set{border-color:#3fae4a}
#lorebok .post.last{border-color:#5a4a33}
#lorebok .post.last .ico{filter:brightness(0);opacity:.75}
#lorebok .post.last::after{content:"???";position:absolute;bottom:1px;right:3px;font-size:10px;color:#9a8a6a}
#lorebok .post.sel{outline:2px solid #fff3c4;outline-offset:1px}
#lorebok .post.ny{animation:lb-glod 1.6s ease-out 2}
@keyframes lb-glod{50%{box-shadow:0 0 14px 4px #c7a35a}}
#lorebok .bild{width:100%;aspect-ratio:16/9;border:2px solid #3b2414;background:#2a2a2a center/cover;margin-bottom:10px;display:flex;align-items:center;justify-content:center}
#lorebok .bild.last{background:#2a2a2a}
#lorebok .bild.last .ico{filter:brightness(0) drop-shadow(0 0 1px #555)}
#lorebok .namn{font-size:22px;margin:0}#lorebok .namn.legendary{color:#8a5e10}#lorebok .namn.set{color:#24702a}#lorebok .namn.last{color:#2a2a2a}
#lorebok .bas{font-size:13px;color:#6b5332;margin:2px 0 8px}
#lorebok ul{margin:4px 0 8px;padding-left:18px;font-size:14px;font-family:Georgia,serif}
#lorebok .lore{font-style:italic;font-family:Georgia,serif;color:#5b3e1c;font-size:15px;line-height:1.45}
#lorebok .tips{position:absolute;bottom:4px;left:0;right:0;text-align:center;color:#c9b48a;font-size:12px}
.lore-notis{position:fixed;left:50%;top:14%;transform:translateX(-50%);padding:10px 26px;font:20px Cinzel,Georgia,serif;color:#f1e3c0;text-shadow:0 1px 2px #000;
 background:#16181b;border:3px solid #4a4f55;outline:1px solid #c7a35a;outline-offset:-7px;box-shadow:0 0 0 2px #050607,0 0 24px rgba(199,163,90,.35);
 animation:lore-in .4s ease-out,lore-ut .6s ease-in 3.4s forwards;z-index:70;pointer-events:none}
@keyframes lore-in{from{opacity:0;transform:translate(-50%,-10px)}}
@keyframes lore-ut{to{opacity:0}}`;
document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

const root = document.createElement('div'); root.id = 'lorebok'; root.className = 'hidden';
root.innerHTML = '<div class="bok"><div class="sida v"></div><div class="sida h"></div><div class="tips">H eller Esc stänger</div></div>';
document.body.appendChild(root);
const left = root.querySelector('.sida.v'), right = root.querySelector('.sida.h');
root.addEventListener('contextmenu', e => e.preventDefault());
root.addEventListener('mousedown', e => { if (e.target === root) close(); e.stopPropagation(); });

let tab = LORE.categories[0].id, sel = null, open = false; const nya = new Set();
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ikon = (p, set, s) => iconHTML({ base: p.base, leg: set ? undefined : p.id, set: set?.id }, s, s, set ? p.id : undefined);
const stats = o => Object.entries(o || {}).map(([k, v]) => fmtStat(k, v)).filter(Boolean);

function renderLeft(f) {
  const n = unlockedSet(f).length;
  let h = `<h2>Lorebok <small>${n}/${TOTAL}</small></h2><div class="flikar">`;
  for (const c of LORE.categories) {
    const ids = c.entries.flatMap(e => e.pieces ? e.pieces.map(p => p.id) : [e.id]);
    h += `<button class="flik${c.id === tab ? ' on' : ''}" data-tab="${c.id}">${esc(c.name)} ${ids.filter(i => isFound(f, i)).length}/${ids.length}</button>`;
  }
  h += '</div>';
  const c = LORE.categories.find(c => c.id === tab);
  const cell = (id, p, set) => { const ok = isFound(f, id), q = p.quality === 'legendary' ? 'legendary' : 'set';
    return `<div class="post ${ok ? q : 'last'}${sel === id ? ' sel' : ''}${nya.has(id) ? ' ny' : ''}" data-id="${id}" title="${ok ? esc(p.name) : '???'}">${ikon(p, set, 44)}</div>`; };
  if (c.id === 'set' || c.entries.some(e => e.pieces)) for (const s of c.entries) {
    const k = s.pieces.filter(p => isFound(f, p.id)).length;
    h += `<div class="grupp${k ? '' : ' las'}" data-set="${s.id}" style="cursor:pointer"><span>${esc(s.name)}</span><span>${k}/${s.pieces.length}</span></div><div class="rut">${s.pieces.map(p => cell(p.id, p, s)).join('')}</div>`;
  } else h += `<div class="rut">${c.entries.map(e => cell(e.id, e)).join('')}</div>`;
  left.innerHTML = h;
}

function renderRight(f) {
  if (!sel) { const c = LORE.categories.find(c => c.id === tab); sel = c.entries[0].pieces ? 'set:' + c.entries[0].id : c.entries[0].id; }
  let h = '';
  if (sel.startsWith('set:')) { // setöversikt: namn syns alltid, bild/lore/bonusar när första delen hittats
    const s = LORE.categories.flatMap(c => c.entries).find(e => e.id === sel.slice(4)), d = SETDATA[s.id] || {};
    const k = s.pieces.filter(p => isFound(f, p.id)).length;
    h += k ? `<div class="bild" style="background-image:url(${LORE_BILDER[s.id] || ''})"></div>` : `<div class="bild last">${ikon(s.pieces[0], s, 96)}</div>`;
    h += `<p class="namn set">${esc(s.name)}</p><p class="bas">Set · ${s.class ? esc(s.class[0].toUpperCase() + s.class.slice(1)) : 'Alla klasser'} · item level ${s.item_level} · ${k}/${s.pieces.length} delar</p>`;
    h += '<ul>' + s.pieces.map(p => `<li>${isFound(f, p.id) ? esc(p.name) : '???'}</li>`).join('') + '</ul>';
    if (k) { h += '<b style="font-size:14px">Setbonusar</b><ul>' + Object.entries(d.bonuses || {}).map(([n, b]) => `<li>${n} delar: ${stats(b).join(', ') || 'specialeffekt'}</li>`).join('') + '</ul>';
      h += `<p class="lore">${esc(s.lore)}</p>`; }
    else h += '<p class="lore">Hitta en del av setet för att läsa mer.</p>';
  } else {
    const P = POSTER[sel], p = P.e, set = P.set, ok = isFound(f, sel);
    const fixed = set ? (SETDATA[set.id]?.pieces || []).find(x => x.id === p.id)?.fixed : LEGDATA[p.id]?.fixed;
    if (!ok) h += `<div class="bild last">${ikon(p, set, 110)}</div><p class="namn last">???</p><p class="bas">${set ? 'Del av ' + esc(set.name) : 'Legendariskt föremål'}</p><p class="lore">Plocka upp föremålet för att låsa upp posten.</p>`;
    else {
      const bild = set ? LORE_BILDER[set.id] : LORE_BILDER[p.id];
      h += `<div class="bild" style="background-image:url(${bild || ''})">${bild ? '' : ikon(p, set, 110)}</div>`;
      h += `<p class="namn ${p.quality === 'legendary' ? 'legendary' : 'set'}">${esc(p.name)}</p><p class="bas">${esc(BASNAMN[p.base] || p.base)}${p.item_level ? ' · item level ' + p.item_level : set ? ' · ' + esc(set.name) : ''}</p>`;
      const st = stats(fixed); if (st.length) h += '<ul>' + st.map(s => `<li>${esc(s)}</li>`).join('') + '</ul>';
      h += `<p class="lore">${esc(p.lore)}</p>`;
    }
  }
  right.innerHTML = h;
}
function render() { if (!open) return; const f = readFound(); renderLeft(f); renderRight(f); }
left.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]'); if (t) { tab = t.dataset.tab; sel = null; return render(); }
  const g = e.target.closest('[data-set]'); if (g) { sel = 'set:' + g.dataset.set; return render(); }
  const p = e.target.closest('[data-id]'); if (p) { sel = p.dataset.id; nya.delete(sel); render(); }
});

function show() { open = true; root.classList.remove('hidden'); render(); }
function close() { open = false; root.classList.add('hidden'); }
function toggle() { open ? close() : show(); }

const heroMenuOpen = () => { const m = document.getElementById('heroMenu'); return !!m && !m.classList.contains('hidden'); };
// Fångstfas: H växlar, Esc stänger. Medan boken är öppen når inga tangenter spelet (utom Alt, som spelet hanterar själv).
addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') return;
  if (e.code === 'KeyH' && !open && heroMenuOpen()) return; // hjältevalet (js/save.js) har företräde
  if (e.code === 'KeyH' && !e.repeat && !e.ctrlKey && !e.metaKey) { e.preventDefault(); e.stopImmediatePropagation(); toggle(); return; }
  if (!open) return;
  if (e.code === 'Escape') close();
  e.stopImmediatePropagation();
}, true);

// ---------- upplåsning ----------
function notis(text = 'Ny lorebokspost (H)') {
  document.querySelectorAll('.lore-notis').forEach(n => n.remove());
  const n = Object.assign(document.createElement('div'), { className: 'lore-notis', textContent: text });
  document.body.appendChild(n); setTimeout(() => n.remove(), 4200);
}
let known = new Set(unlockedSet(readFound()));
function newlyUnlocked(id) {
  if (known.has(id)) return; known.add(id); nya.add(id);
  notis('Ny lorebokspost: ' + POSTER[id].e.name + ' (H)');
  try { bus().emit('lore_unlock', id); } catch {}
  render();
}
// pickup(itemId, first): säkerställ att id:t finns i rpg_found (skriver aldrig över befintlig post) och lås upp.
function onPickup(itemId) {
  const id = resolve(itemId); if (!id) return;
  const f = readFound();
  if (!f[id]) { f[id] = { first: new Date().toISOString(), src: 'lorebok' }; try { localStorage.setItem(FOUND_KEY, JSON.stringify(f)); } catch {} }
  newlyUnlocked(id);
}
// Kontroll av rpg_found fångar upplock som game.js sparar utan event, och laddning av annan sparfil.
setInterval(() => { const f = readFound(); const now = unlockedSet(f);
  if (now.length < known.size) { known = new Set(now); render(); return; } // annan hjälte/sparfil laddad
  for (const id of now) newlyUnlocked(id); }, 1000);

// Event-buss: använd befintlig window.__rpg.on/emit; skapa minimal fallback bara om de saknas.
// game.js ersätter window.__rpg när det laddat klart, så kopplingen görs om när objektet byts.
const lyss = {};
function bus() {
  const r = window.__rpg || (window.__rpg = {});
  if (typeof r.on !== 'function' || typeof r.emit !== 'function') {
    const L = r.__lyss || (r.__lyss = lyss);
    if (typeof r.on !== 'function') r.on = (ev, fn) => { (L[ev] || (L[ev] = [])).push(fn); return () => { L[ev] = L[ev].filter(x => x !== fn); }; };
    if (typeof r.emit !== 'function') r.emit = (ev, ...a) => { for (const fn of L[ev] || []) try { fn(...a); } catch (err) { console.warn(err); } };
  }
  return r;
}
const kopplade = new WeakSet();
function koppla() { const r = bus(); if (kopplade.has(r)) return; kopplade.add(r); r.on('pickup', onPickup); r.lorebok = { open: show, close, toggle, isOpen: () => open, unlock: onPickup }; }
koppla(); setInterval(koppla, 1000);
export const lorebok = { open: show, close, toggle, isOpen: () => open };
