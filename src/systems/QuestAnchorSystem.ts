import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { QuestEngine } from '../quest/questEngine';
import type { QuestEngineHooks } from '../quest/questEngine';
import { questAnchorsForArea } from '../quest/questAnchors';
import type { World } from './World';

/** När hjälten når ett quest-ankare: inspektera + region med ankare (gå_in_i). */
export class QuestAnchorSystem {
  private inside = new Set<string>();

  constructor(
    private readonly bus: EventBus<GameEvents>,
    private readonly questEngine: QuestEngine,
    private readonly hooks: () => QuestEngineHooks | null,
  ) {}

  update(w: World): void {
    const h = this.hooks();
    if (!h) return;
    const areaId = w.zone.areaId;
    const anchors = questAnchorsForArea(areaId);
    const px = w.hero.pos.x;
    const py = w.hero.pos.y;
    const nowInside = new Set<string>();
    for (const a of anchors) {
      const d = Math.hypot(px - a.pos[0], py - a.pos[1]);
      if (d <= a.radius) nowInside.add(a.id);
    }
    for (const id of nowInside) {
      if (this.inside.has(id)) continue;
      this.questEngine.onInspect(id, h);
      this.questEngine.onEnterRegion(areaId, id, h);
      this.bus.emit('quest_inspect', { ankare: id });
    }
    this.inside = nowInside;
  }

  reset(): void {
    this.inside.clear();
  }
}
