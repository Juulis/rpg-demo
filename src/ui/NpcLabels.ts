import type { Camera } from '../render/Camera';
import type { NpcEntity } from '../entities/NpcEntity';
import { npcName } from '../npc/npcText';
import type { Text } from '../text/Text';

/** Namnskyltar över NPC:er. */
export class NpcLabels {
  private readonly root = document.createElement('div');
  private readonly els = new Map<NpcEntity, HTMLDivElement>();

  constructor(private readonly text: Text) {
    this.root.id = 'npcLabels';
    document.body.appendChild(this.root);
  }

  update(npcs: readonly NpcEntity[], cam: Camera): void {
    for (const [n, el] of this.els)
      if (!npcs.includes(n)) {
        el.remove();
        this.els.delete(n);
      }
    for (const n of npcs) {
      let el = this.els.get(n);
      if (!el) {
        el = document.createElement('div');
        el.className = 'npcLabel';
        this.root.appendChild(el);
        this.els.set(n, el);
      }
      el.textContent = npcName(this.text, n.resolved.def);
      const p = cam.toScreen(n.resolved.pos.x, n.resolved.pos.y, 52);
      const w = el.offsetWidth || 60;
      el.style.transform = `translate(${p.x - w / 2}px, ${p.y}px)`;
    }
  }

  dispose(): void {
    this.root.remove();
  }
}
