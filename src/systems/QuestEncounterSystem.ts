import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { Vec2 } from '../core/GameContext';
import type { MonsterFactory } from '../entities/MonsterFactory';
import type { QuestEngineHooks } from '../quest/questEngine';
import { readQuestProgress } from '../quest/questProgress';
import { questAnchorById } from '../quest/questAnchors';
import { canonicalBossId } from '../world/bossIds';
import type { SpawnSpec } from './SpawnSystem';
import type { LootSystem } from './LootSystem';
import type { World } from './World';
import type { WorldStateService } from '../world/WorldStateService';

const MIRA_CHAMPION_UID = 'quest:miras_bror:champion';
const SKULL_AMBUSH_PREFIX = 'quest:benens_visk:lik:';
const ULVHILD_UID = 'quest:ulvhilds_pals:boss';
const GRAV_GUARD_UID = 'quest:gravvaktarnas_sista_strid:vakt';

/** Questspecifika monster och garanterad loot (akt 1, #44–#45). */
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
    this.bus.on('quest_inspect', ({ ankare }) => {
      if (ankare === 'gravvaktarnas_kammare') this.worldState.get().flags.krypta_besokt = true;
    });
  }

  reset(): void {
    this.skullLootSpawned = false;
  }

  update(w: World, hooks: QuestEngineHooks): void {
    const ws = this.worldState.get();
    this.updateMirasBro(w, hooks, ws);
    this.updateBenensVisk(w, hooks, ws);
    this.updateUlvhildsPals(w, hooks, ws);
    this.updateGravvaktarnasStrid(w, hooks, ws);
  }

  private updateMirasBro(w: World, hooks: QuestEngineHooks, ws: ReturnType<WorldStateService['get']>): void {
    const mira = readQuestProgress(ws, 'miras_bror');
    if (mira.status === 'aktiv' && mira.steg === 'sanningen' && !hooks.hasItem('flyktingens_sandaler')) {
      if (!ws.flags.quest_mira_champion_slain && !this.hasLivingQuestMonster(w, MIRA_CHAMPION_UID)) {
        this.spawnChampion(w);
      }
      if (ws.flags.quest_mira_champion_slain && !hooks.hasItem('flyktingens_sandaler') && !this.hasQuestDrop(w, 'flyktingens_sandaler')) {
        this.spawnQuestItem(w, 'kolarkojan', 'flyktingens_sandaler');
      }
    }
  }

  private updateBenensVisk(w: World, hooks: QuestEngineHooks, ws: ReturnType<WorldStateService['get']>): void {
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

  private updateUlvhildsPals(w: World, hooks: QuestEngineHooks, ws: ReturnType<WorldStateService['get']>): void {
    const ulv = readQuestProgress(ws, 'ulvhilds_pals');
    if (ulv.status !== 'aktiv') return;
    const bossId = canonicalBossId('grabjornen_ulvhild') ?? 'grabjornen_ulvhild';
    const bossDead = ws.bosses_killed.includes(bossId) || ws.bosses_killed.includes('grabjornen_ulvhild');
    if (ulv.steg === 'ulvhild' && !bossDead && !this.hasLivingQuestMonster(w, ULVHILD_UID)) {
      this.spawnUlvhildBoss(w);
    }
    if (ulv.steg === 'palsen' && !hooks.hasItem('quest_ulvhilds_pals') && !this.hasQuestDrop(w, 'quest_ulvhilds_pals')) {
      this.spawnQuestItem(w, 'ulvhilds_ide', 'quest_ulvhilds_pals');
    }
  }

  private updateGravvaktarnasStrid(w: World, hooks: QuestEngineHooks, ws: ReturnType<WorldStateService['get']>): void {
    const grav = readQuestProgress(ws, 'gravvaktarnas_sista_strid');
    if (grav.status !== 'aktiv') return;
    if (grav.steg === 'kryptan' && !ws.flags.quest_grav_guard_slain && !this.hasLivingQuestMonster(w, GRAV_GUARD_UID)) {
      this.spawnGravGuard(w);
    }
    if (grav.steg === 'kronikan' && !hooks.hasItem('quest_gravvaktarnas_kronika') && !this.hasQuestDrop(w, 'quest_gravvaktarnas_kronika')) {
      this.spawnQuestItem(w, 'gravvaktarnas_kammare', 'quest_gravvaktarnas_kronika');
    }
  }

  private onKill(uid: string): void {
    const ws = this.worldState.get();
    if (uid === MIRA_CHAMPION_UID) ws.flags.quest_mira_champion_slain = true;
    if (uid === GRAV_GUARD_UID) ws.flags.quest_grav_guard_slain = true;
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

  private spawnUlvhildBoss(w: World): void {
    const pos = this.anchorPos('ulvhilds_ide');
    if (!pos) return;
    const spec: SpawnSpec = {
      uid: ULVHILD_UID,
      enemy: 'grabjornen_ulvhild',
      pos: [pos.x, pos.y],
      level: 6,
      elite: null,
      modifiers: [],
      boss: true,
    };
    w.zone.collide(pos, 0.5);
    this.factory.create(w, 'grabjornen_ulvhild', pos, spec.level, spec);
  }

  private spawnGravGuard(w: World): void {
    const pos = this.anchorPos('gravvaktarnas_kammare');
    if (!pos) return;
    const spec: SpawnSpec = {
      uid: GRAV_GUARD_UID,
      enemy: 'skelett_vakt',
      pos: [pos.x, pos.y],
      level: 9,
      elite: 'unik',
      modifiers: [],
      uniqueName: 'Skelettväktaren',
      boss: false,
    };
    w.zone.collide(pos, 0.5);
    this.factory.create(w, 'skelett_vakt', pos, spec.level, spec);
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
