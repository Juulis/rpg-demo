// Enkel event-bus utan beroenden: on(evt, fn) → avregistrera, off, once, emit(evt, ...args).
// game.js utökar window.__rpg med denna buss utan att ersätta objektet; en tidigare buss (t.ex. ljudets minimala) får fortsatt alla emit.
// Händelser (args): hit({monsterId,dmg,crit,strong}), kill({id,monsterId,area,lvl,champion,unique,boss}), loot_drop(quality), pickup(itemId, first),
// gold(amount, total), rune(n), portal_open(), portal_sealed(), zone_enter(name, areaId), boss_phase(phase, name), step(), new_game({seed}), level_up(n).
// Alias: death (= kill), rune_activate (= rune), boss_start({id}) när bossen vaknar. loot_drop(quality, {quality, …}).
export function createBus() {
  const L = new Map();
  const off = (evt, fn) => L.get(evt)?.delete(fn);
  const on = (evt, fn) => { if (!L.has(evt)) L.set(evt, new Set()); L.get(evt).add(fn); return () => off(evt, fn); };
  const once = (evt, fn) => { const u = on(evt, (...a) => { u(); fn(...a); }); return u; };
  const emit = (evt, ...args) => { for (const fn of [...(L.get(evt) || [])]) { try { fn(...args); } catch (e) { console.warn('[bus]', evt, e); } } };
  return { on, off, once, emit };
}
// Kopplar bussen till ett befintligt objekt (window.__rpg). Behåller tidigare on/emit: deras lyssnare nås via den gamla emit.
export function attachBus(target) {
  const bus = createBus(), prevEmit = typeof target.emit === 'function' && !target.emit.__rpgBus ? target.emit : null;
  const emit = (evt, ...args) => { bus.emit(evt, ...args); if (prevEmit) try { prevEmit(evt, ...args); } catch (e) { console.warn('[bus]', e); } };
  emit.__rpgBus = true;
  Object.assign(target, { on: bus.on, off: bus.off, once: bus.once, emit });
  return target;
}
