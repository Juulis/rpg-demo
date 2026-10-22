import type { Camera } from '../render/Camera';

/** Kort pratbubbla när hjälten går förbi en NPC. */
export class NpcBark {
  private readonly el = document.createElement('div');
  private until = 0;
  private anchor: { x: number; y: number } | null = null;

  constructor() {
    this.el.className = 'npc-bark hidden';
    document.body.appendChild(this.el);
  }

  show(line: string, worldX: number, worldY: number, duration = 3.2): void {
    this.el.textContent = line;
    this.el.classList.remove('hidden');
    this.anchor = { x: worldX, y: worldY };
    this.until = duration;
  }

  update(dt: number, cam: Camera): void {
    if (this.until <= 0) return;
    this.until -= dt;
    if (this.until <= 0) {
      this.el.classList.add('hidden');
      this.anchor = null;
      return;
    }
    if (!this.anchor) return;
    const p = cam.toScreen(this.anchor.x, this.anchor.y, 58);
    const w = this.el.offsetWidth || 120;
    this.el.style.transform = `translate(${p.x - w / 2}px, ${p.y - 8}px)`;
  }

  dispose(): void {
    this.el.remove();
  }
}
