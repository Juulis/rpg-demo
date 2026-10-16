import type { Camera } from '../render/Camera';
import type { LootSystem } from '../systems/LootSystem';
import type { GroundDrop } from '../systems/World';

/** Etiketter för föremål på marken: visas medan Alt hålls eller permanent med Z. Klick på etikett = plocka upp. */
export class LootLabels {
  private readonly root = document.createElement('div');
  private readonly els = new Map<GroundDrop, HTMLDivElement>();
  onClick: (d: GroundDrop) => void = () => undefined;

  constructor(private readonly loot: LootSystem) {
    this.root.id = 'lootLabels';
    document.body.appendChild(this.root);
  }

  update(drops: readonly GroundDrop[], visible: boolean, cam: Camera): void {
    this.root.classList.toggle('on', visible);
    for (const [d, el] of this.els)
      if (!drops.includes(d)) {
        el.remove();
        this.els.delete(d);
      }
    if (!visible) return;
    const placed: { x: number; y: number; w: number }[] = [];
    const sorted = [...drops].filter((d) => !d.data.gold).sort((a, b) => this.loot.rank(a.data) - this.loot.rank(b.data));
    for (const d of sorted) {
      let el = this.els.get(d);
      if (!el) {
        el = document.createElement('div');
        el.className = 'lootLabel';
        el.textContent = this.loot.label(d.data);
        el.style.color = this.loot.color(d.data);
        const target = d;
        el.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.onClick(target);
        });
        this.root.appendChild(el);
        this.els.set(d, el);
      }
      const p = cam.toScreen(d.pos.x, d.pos.y, 34);
      let y = p.y;
      const w = el.offsetWidth || 80;
      // enkel stapling så etiketter inte överlappar
      for (let guard = 0; guard < 20 && placed.some((q) => Math.abs(q.y - y) < 20 && Math.abs(q.x - p.x) < (q.w + w) / 2); guard++) y -= 20;
      placed.push({ x: p.x, y, w });
      el.style.transform = `translate(${p.x - w / 2}px, ${y - 20}px)`;
    }
  }

  dispose(): void {
    this.root.remove();
  }
}
