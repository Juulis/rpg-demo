// D2-spawn enligt spawnzoner.json v2 (session_roll) och monster_niva.json (elites). Fri från Three.js.
// Allt i ett område slumpas EN gång per game ur hash(game_seed, area_id[, point_id]); döda id hoppas över vid omladdning.
export const hashSeed = (...parts) => { let h = 2166136261 >>> 0; for (const c of parts.join('|')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
export const newGameSeed = () => (Math.random() * 2 ** 32) >>> 0;
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ri = (r, v) => { if (!Array.isArray(v)) return v ?? 1; const [a, b] = v; return a + Math.floor(r() * (b - a + 1)); };
export function pickRow(r, table) { const sum = table.reduce((a, x) => a + x.weight, 0); let v = r() * sum; for (const x of table) if ((v -= x.weight) < 0) return x; return table[table.length - 1]; }
function shuffle(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const around = (r, p, rad) => { const a = r() * 6.2832, d = Math.sqrt(r()) * rad; return [p.pos[0] + Math.cos(a) * d, p.pos[1] + Math.sin(a) * d]; };

// Kontrakt (utvecklare 2, autosparning): spelet läser window.__rpg.session = { seed:number, killed:Set<string> } före spawn
// (skapas annars). Monster-id är deterministiska från seed: `${areaId}:${spawnPointIndex}:${monsterIndex}` (index räknas per punkt,
// i slumpordning: grupper, sedan unik + minions), boss: `${areaId}:boss`. Id i killed hoppas över. Vid död läggs id i session.killed och
// bus emit('kill', {id, monsterId, area, lvl, champion, unique}). Nytt spel: ny seed, tom killed, emit('new_game', {seed}).
// Returnerar { monsters: [{uid, enemy, pos:[x,y], lvl, elite, mods, uname, point, zone}], boss }.
// state: { seed, dead:Set (= session.killed), cityState, bossDefeated:bool }. Positioner i områdets egna koordinater.
export function rollArea(A, state, MN, levelOf = () => 1) {
  const out = { monsters: [], boss: null };
  if (A.city_id && state.cityState && state.cityState !== 'besatt') return out; // rensad/återbefolkad stänger spawn permanent
  const R = A.session_roll || {}, E = MN.elites, r = rng(hashSeed(state.seed, A.id));
  const pts = A.spawn_points, always = pts.filter(p => p.always_active || p.zone), rest = shuffle(r, pts.filter(p => !always.includes(p)));
  const nAct = R.active_spawn_points ? Math.max(always.length, ri(r, R.active_spawn_points)) : pts.length;
  const active = [...always, ...rest.slice(0, Math.max(0, nAct - always.length))];
  const inactive = rest.slice(Math.max(0, nAct - always.length));
  const idx = new Map(), uidOf = p => { const pi = pts.indexOf(p), n = idx.get(pi) || 0; idx.set(pi, n + 1); return `${A.id}:${pi}:${n}`; };
  let champs = 0; const champMax = R.champions?.max ?? 1, champP = R.champions?.chance_per_group ?? A.champion_chance_per_group ?? 0;
  const add = (o) => { if (!state.dead.has(o.uid)) out.monsters.push(o); };
  for (const p of active) {
    const pr = rng(hashSeed(state.seed, A.id, p.id)), table = (A.zone_tables && p.zone && A.zone_tables[p.zone]) || A.enemy_table;
    for (let g = 0, ng = ri(pr, p.groups || [1, 1]); g < ng; g++) {
      const row = pickRow(pr, p.enemy_table || table), lvl = levelOf(row.enemy); // fast nivå per undertyp
      const champ = champs < champMax && pr() < champP; if (champ) champs++;
      const n = champ ? ri(pr, [2, 3]) : ri(pr, row.group || p.group_size || R.monsters_per_group || [1, 1]), lb = champ ? 1 : 0; // champion +1 nivå
      for (let i = 0; i < n; i++) add({ uid: uidOf(p), enemy: row.enemy, pos: around(pr, p, p.radius), lvl: lvl + lb, elite: champ ? 'champion' : null, point: p.id, zone: p.zone });
    }
  }
  // Unika: chans per game, högst max, vid en slumpad aktiv punkt med minions.
  const uMax = R.uniques?.max ?? A.unique_max_per_game ?? 0, uP = R.uniques?.chance_per_game ?? A.unique_chance_per_game ?? 0;
  const NAMES = E.unique_names || E.unik.unique_names || ['Namnlös'];
  for (let u = 0; u < uMax; u++) {
    if (r() >= uP || !active.length) continue;
    const p = active[Math.floor(r() * active.length)], row = pickRow(r, p.enemy_table || A.enemy_table), lvl = levelOf(row.enemy);
    const nm = NAMES[Math.floor(r() * NAMES.length)], mods = shuffle(r, E.modifiers.map(m => m.id)).slice(0, ri(r, E.unik.modifiers_count));
    add({ uid: uidOf(p), enemy: row.enemy, pos: around(r, p, p.radius * 0.5), lvl: lvl + 3, elite: 'unik', mods, uname: nm, point: p.id, zone: p.zone });
    for (let i = 0, n = ri(r, E.unik.minions.count); i < n; i++) add({ uid: uidOf(p), enemy: row.enemy, pos: around(r, p, p.radius), lvl: lvl + 1, elite: 'minion', point: p.id, zone: p.zone });
  }
  out.inactive = inactive.map(p => p.id);
  if (A.boss && !state.bossDefeated) out.boss = { uid: `${A.id}:boss`, enemy: A.boss.enemy, pos: A.boss.pos };
  return out;
}

// Multiplikatorer för elites (monster_niva.json elites + modifiers).
export function eliteStats(spec, MN) {
  const E = MN.elites, idx = new Map(), uidOf = p => { const pi = pts.indexOf(p), n = idx.get(pi) || 0; idx.set(pi, n + 1); return `${A.id}:${pi}:${n}`; }, e = spec.elite === 'minion' ? E.champion : E[spec.elite]; if (!e) return null;
  // Champion: HP ×2,5 skada ×1,4. Unik: HP ×4 skada ×1,6 (design_oversikt.md).
  const s = { hp: spec.elite === 'unik' ? 4 : 2.5, dmg: spec.elite === 'unik' ? 1.6 : 1.4, def: e.defense_add, xp: spec.elite === 'minion' ? E.champion.xp_mult : e.xp_mult, speed: 1, cd: 1, kbImmune: false, vamp: 0, curse: false, thorns: 0,
    loot: spec.elite === 'minion' ? null : e.loot };
  for (const m of spec.mods || []) {
    if (m === 'extra_stark') s.dmg *= 1.3; if (m === 'extra_snabb') { s.speed = 1.4; s.cd = 0.8; } if (m === 'stenhud') { s.def += 6; s.kbImmune = true; }
    if (m === 'vampyrisk') s.vamp = 0.10; if (m === 'forbannad') s.curse = true; if (m === 'tornig') s.thorns = 0.15;
  }
  return s;
}
export const MOD_NAME = { extra_stark: 'Extra stark', extra_snabb: 'Extra snabb', stenhud: 'Stenhud', vampyrisk: 'Vampyrisk', forbannad: 'Förbannad', tornig: 'Tornig' };
