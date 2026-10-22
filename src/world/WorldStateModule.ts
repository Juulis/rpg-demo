import { Disposables } from '../core/Disposables';
import type { GameContext, GameModule } from '../core/GameContext';
/** Kopplar busshändelser till world_state (issue #37). */
export class WorldStateModule implements GameModule {
  private readonly d = new Disposables();

  init(ctx: GameContext): void {
    const bus = ctx.bus;
    const world = ctx.worldState;
    this.d.add(bus.on('boss_killed', ({ id }) => world.recordBossKilled(id)));
    this.d.add(bus.on('legendary_found', ({ itemId }) => world.recordLegendaryFound(itemId)));
    this.d.add(bus.on('city_state_changed', ({ city, state }) => world.setCityState(city, state)));
    this.d.add(bus.on('runes_changed', ({ count }) => world.setRunesActive(count)));
    this.d.add(
      bus.on('pickup', ({ itemId, first, quality }) => {
        if (first && quality === 'legendary') world.recordLegendaryFound(itemId);
      }),
    );
  }

  dispose(): void {
    this.d.dispose();
  }
}
