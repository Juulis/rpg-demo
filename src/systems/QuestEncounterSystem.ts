import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { Vec2 } from '../core/GameContext';
import type { MonsterFactory } from '../entities/MonsterFactory';
import type { QuestEngineHooks } from '../quest/questEngine';
import { readQuestProgress } from '../quest/questProgress';
import { questAnchorById } from '../quest/questAnchors';
import type { SpawnSpec } from './SpawnSystem';
import type { LootSystem } from './LootSystem';
import type { World } from './World';
import type { WorldStateService } from '../world/WorldStateService';

const MIRA_CHAMPION_UID = 'quest:miras_bror:champion';
const SKULL_AMBUSH_PREFIX = 'quest:benens_visk:lik:';

/** Questspecifika monster och garanterad loot för akt 1 del 1 (#44). */
export class QuestEncounterSystem {
  private skullLootSpawned = false;

  constructor(
    private readonly bus: EventBus<GameEvents>,
    private readonly worldState: WorldStateService,
    private readonly factory: MonsterFactory,
    private readonly loot: LootSystem,
    private readonly world: () => World | null,
  ) {
    this.bus.on('kill', (p) => this.onKill(p.id));
    this.bus.on('pickup', (p) => this.onPickup(p.itemId));
  }

  reset(): void {
    this.skullLootSpawned = false;
  }

  update(w: World, hooks: QuestEngineHooks): void {
    const ws = this.worldState.get();
    const mira = readQuestProgress(ws, 'miras_bror');
    if (mira.status === 'aktiv' && mira.steg === 'sanningen' && !hooks.hasItem('flyktingens_sandaler')) {
      if (!ws.flags.quest_mira_champion_slain && !this.hasLivingQuestMonster(w, MIRA_CHAMPION_UID)) {
        this.spawnChampion(w);
      }
      if (ws.flags.quest_mira_champion_slain && !hooks.hasItem('flyktingens_sandaler') && !this.hasQuestDrop(w, 'flyktingens_sandaler')) {
        this.spawnQuestItem(w, 'kolarkojan', 'flyktingens_sandaler');
      }
    }

    const visk = readQuestProgress(ws, 'benens_visk');
    if (
      visk.status === 'aktiv' &&
      visk.steg === 'skallen' &&
      !hooks.hasItem('viskarens_skalle') &&
      !this.skullLootSpawned &&
      !this.hasQuestDrop(w, 'viskarens_skalle')
    ) {
      this.spawnQuestItem(w, 'viskarens_hus_skallar', 'viskarens_skalle');
      this.skullLootSpawned = true;
    }
  }

  private onKill(uid: string): void {
    if (uid === MIRA_CHAMPION_UID) {
      this.worldState.get().flags.quest_mira_champion_slain = true;
    }
  }

  private onPickup(itemId: string): void {
    if (itemId !== 'viskarens_skalle') return;
    const ws = this.worldState.get();
    if (ws.flags.quest_skull_ambush_done) return;
    ws.flags.quest_skull_ambush_done = true;
    const w = this.world();
    if (!w) return;
    const anchor = questAnchorById('viskarens_hus_skallar');
    const pos = anchor ? { x: anchor.pos[0], y: anchor.pos[1] } : w.hero.pos;
    this.spawnRottingPair(w, pos);
  }

  private hasLivingQuestMonster(w: World, uid: string): boolean {
    return w.monsters.some((m) => m.uid === uid && m.dead <= 0);
  }

  private hasQuestDrop(w: World, baseId: string): boolean {
    return w.drops.some((d) => d.data.item && (d.data.item as { base?: string }).base === baseId);
  }

  private anchorPos(anchorId: string): Vec2 | null {
    const a = questAnchorById(anchorId);
    if (!a) return null;
    return { x: a.pos[0], y: a.pos[1] };
  }

  private spawnChampion(w: World): void {
    const pos = this.anchorPos('kolarkojan');
    if (!pos) return;
    const spec: SpawnSpec = {
      uid: MIRA_CHAMPION_UID,
      enemy: 'vargbest',
      pos: [pos.x, pos.y],
      level: 4,
      elite: 'champion',
      modifiers: [],
      boss: false,
    };
    w.zone.collide(pos, 0.5);
    this.factory.create(w, 'vargbest', pos, spec.level, spec);
  }

  private spawnRottingPair(w: World, at: Vec2): void {
    for (let i = 0; i < 2; i++) {
      const pos = { x: at.x + (i === 0 ? -1.2 : 1.2), y: at.y + 0.8 };
      w.zone.collide(pos, 0.5);
      const spec: SpawnSpec = {
        uid: `${SKULL_AMBUSH_PREFIX}${i}`,
        enemy: 'ruttnande_lik',
        pos: [pos.x, pos.y],
        level: 4,
        elite: 'minion',
        modifiers: [],
        uniqueName: 'Ruttnande lik',
        boss: false,
      };
      this.factory.create(w, 'ruttnande_lik', pos, spec.level, spec);
    }
  }

  private spawnQuestItem(w: World, anchorId: string, baseId: string): void {
    const pos = this.anchorPos(anchorId);
    if (!pos) return;
    const item = w.L.makeItem(baseId, { quality: 'legendary', ilvl: Math.max(2, w.hero.level) });
    this.loot.spawn(pos, { item });
  }
}
