// Motoroberoende tooltips (DOM). Stil: .tooltip / .tooltip--liten (assets/hud/inventory.css), Cinzel, ~250 ms fördröjning.
// Användning för andra moduler:
//   <div data-tip="Text">            enkel text
//   <div data-tip-html="<b>..</b>">   HTML
//   <div data-tip="@hp">             dynamisk: tooltip.provide('hp', el => html)
//   data-tip-small                    liten variant
// API: tooltip.show(html, x, y, {small, now}), tooltip.hide(), tooltip.provide(key, fn), tooltip.avoid(el) (rektangel som inte täcks).
export function createTooltip({ delay = 250, root = document.body } = {}) {
  const el = document.createElement('div'); el.className = 'tooltip rk-tip'; el.style.display = 'none'; root.appendChild(el);
  const providers = {}, avoid = new Set(); let timer = 0, cur = null, lastXY = [0, 0];
  const place = (x, y) => {
    const w = el.offsetWidth, h = el.offsetHeight, W = innerWidth, H = innerHeight; let px = x + 16, py = y + 18;
    if (px + w > W - 6) px = x - w - 12; if (py + h > H - 6) py = y - h - 12;
    for (const a of avoid) { if (!a.isConnected || a.offsetParent === null) continue; const r = a.getBoundingClientRect();
      if (px < r.right && px + w > r.left && py < r.bottom && py + h > r.top) { py = r.top - h - 8; if (py < 6) px = r.right + 8; } }
    el.style.left = Math.max(6, Math.min(W - w - 6, px)) + 'px'; el.style.top = Math.max(6, Math.min(H - h - 6, py)) + 'px';
  };
  const resolve = t => { const k = t.dataset.tip; if (t.dataset.tipHtml) return t.dataset.tipHtml; if (k?.startsWith('@')) return providers[k.slice(1)]?.(t) ?? ''; return k ? k.replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;') : ''; };
  function show(html, x, y, o = {}) {
    clearTimeout(timer); const go = () => { if (!html) return hide(); el.innerHTML = html; el.classList.toggle('tooltip--liten', !!o.small); el.style.display = 'block'; place(x, y); };
    o.now || el.style.display === 'block' ? go() : (timer = setTimeout(go, delay));
  }
  function hide() { clearTimeout(timer); el.style.display = 'none'; cur = null; }
  addEventListener('pointerover', e => { const t = e.target.closest?.('[data-tip],[data-tip-html]'); if (t === cur) return; cur = t; if (!t) { if (!world) hide(); return; } world = false;
    timer && clearTimeout(timer); timer = setTimeout(() => { if (cur !== t) return; const h = resolve(t); if (!h) return; el.innerHTML = h; el.classList.toggle('tooltip--liten', 'tipSmall' in t.dataset); el.style.display = 'block'; place(...lastXY); }, delay); }, true);
  addEventListener('pointermove', e => { lastXY = [e.clientX, e.clientY]; if (cur && el.style.display === 'block') { const h = resolve(cur); if (h !== el.innerHTML) el.innerHTML = h; place(e.clientX, e.clientY); } }, true);
  addEventListener('pointerdown', () => { if (cur) hide(); }, true);
  let world = false; // världstooltip (monster/loot) styrs av spelet via showWorld/hideWorld
  return { el, show, hide, provide: (k, fn) => { providers[k] = fn; }, avoid: a => avoid.add(a),
    showWorld(html, x, y, o) { if (cur) return; world = true; show(html, x, y, o); }, hideWorld() { if (world) { world = false; hide(); } }, get busy() { return !!cur; } };
}
