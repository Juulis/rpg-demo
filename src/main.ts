import './style.css';
import './ui/ui.css';
import { Game } from './core/Game';
import type { GameModule } from './core/GameContext';
import { AudioModule, MapModule, MenuModule, SaveModule } from './index';
import { LocaleManager } from './i18n';

/**
 * Moduler registreras här. Varje modul får GameContext (bus, hero, zone, session, data) via init().
 * Registrerade: SaveModule (via Game som HeroGateway), MenuModule, AudioModule, MapModule. Lorebook tillkommer.
 */
const i18n = new LocaleManager();
const save = new SaveModule(i18n, {
  loadHero: (s) => game.loadHero(s),
  getSnapshot: () => game.getSnapshot(),
  setSaveBackend: (b) => game.setSaveBackend(b),
});
const modules: GameModule[] = [i18n, save, new MenuModule(save, i18n), new AudioModule(i18n), new MapModule(i18n)];

const host = document.getElementById('app');
if (!host) throw new Error('#app saknas');
const game = new Game(modules);
i18n.attachText(game.text);
await game.start(host);
document.getElementById('newGame')?.addEventListener('click', () => game.newGame());

// Debug-hook bara i dev-bygget (inga globaler i produktion).
if (import.meta.env.DEV) (window as unknown as { __game?: Game }).__game = game;
