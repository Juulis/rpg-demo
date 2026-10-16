import type { GameContext, GameModule } from '../core/GameContext';
import type { SaveModule } from '../save/SaveModule';
import { ConfirmDialog } from './ConfirmDialog';
import { CreateHeroDialog } from './CreateHeroDialog';
import { HeroSelectMenu } from './HeroSelectMenu';
import { MenuAssets } from './MenuAssets';

/** Startmenyn. Kräver att SaveModule är initierad före (main.ts registrerar save före menu). */
export class MenuModule implements GameModule {
  private menu: HeroSelectMenu | null = null;
  private style: HTMLStyleElement | null = null;

  constructor(
    private readonly save: SaveModule,
    private readonly host: () => HTMLElement = () => document.body,
    private readonly showOnInit = true,
  ) {}

  init(ctx: GameContext): void {
    const assets = new MenuAssets();
    this.style = document.createElement('style');
    this.style.textContent = assets.css();
    document.head.appendChild(this.style);
    this.menu = new HeroSelectMenu({
      bus: ctx.bus,
      roster: this.save.roster,
      loader: this.save.loader,
      onLeaveGame: () => {
        if (this.save.autosave.isPlaying) this.save.autosave.end(true);
        ctx.hero.playing = false;
      },
      assets,
      create: new CreateHeroDialog(this.save.roster, assets),
      confirm: new ConfirmDialog(),
    });
    this.host().appendChild(this.menu.root);
    if (this.showOnInit) this.menu.show();
  }

  /** Visa hjältevalet (t.ex. från motorns "Spela igen"/Esc-meny). */
  show(): void {
    this.menu?.show();
  }

  get isOpen(): boolean {
    return this.menu?.isOpen ?? false;
  }

  dispose(): void {
    this.menu?.root.remove();
    this.style?.remove();
    this.menu = null;
  }
}
