import type { Camera } from '../render/Camera';
import type { NpcEntity } from '../entities/NpcEntity';
import { npcName } from '../npc/npcText';
import type { Text } from '../text/Text';

/** Namnskyltar och rykte-gnista över NPC:er. */
export class NpcLabels {
  private readonly root = document.createElement('div');
  private readonly els = new Map<NpcEntity, HTMLDivElement>();
  private readonly sparks = new Map<NpcEntity, HTMLDivElement>();
  private readonly sparkOn = new Set<NpcEntity>();

  constructor(private readonly text: Text) {
    this.root.id = 'npcLabels';
    document.body.appendChild(this.root);
  }

  update(npcs: readonly NpcEntity[], cam: Camera, sparkNpcIds?: ReadonlySet<string>): void {
    for (const [n, el] of this.els)
      if (!npcs.includes(n)) {
        el.remove();
        this.els.delete(n);
      }
    for (const [n, el] of this.sparks)
      if (!npcs.includes(n)) {
        el.remove();
        this.sparks.delete(n);
        this.sparkOn.delete(n);
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

      const wantSpark = sparkNpcIds?.has(n.resolved.def.id) ?? false;
      let spark = this.sparks.get(n);
      if (wantSpark) {
        if (!spark) {
          spark = document.createElement('div');
          spark.className = 'npc-rumor-spark';
          spark.setAttribute('aria-hidden', 'true');
          this.root.appendChild(spark);
          this.sparks.set(n, spark);
        }
        spark.classList.remove('hidden');
        const sp = cam.toScreen(n.resolved.pos.x, n.resolved.pos.y, 68);
        spark.style.transform = `translate(${sp.x - 6}px, ${sp.y - 4}px)`;
        this.sparkOn.add(n);
      } else if (spark) {
        spark.classList.add('hidden');
        this.sparkOn.delete(n);
      }
    }
  }

  dispose(): void {
    this.root.remove();
  }
}
