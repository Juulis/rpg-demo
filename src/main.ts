import './style.css';
import { Game } from './core/Game';
import type { GameModule } from './core/GameContext';
import { AudioModule, MapModule, MenuModule, SaveModule } from './index';

/**
 * Moduler registreras här. Varje modul får GameContext (bus, hero, zone, session, data) via init().
 * Registrerade: SaveModule (via Game som HeroGateway), MenuModule, AudioModule, MapModule. Lorebook tillkommer.
 */
// Game skapas nedan; gatewayen anropas först efter init (vid laddning/sparning).
const save = new SaveModule({
  loadHero: (s) => game.loadHero(s),
  getSnapshot: () => game.getSnapshot(),
});
const modules: GameModule[] = [save, new MenuModule(save), new AudioModule(), new MapModule()]; // save före menu

const host = document.getElementById('app');
if (!host) throw new Error('#app saknas');
const game = new Game(modules);
await game.start(host);
document.getElementById('newGame')?.addEventListener('click', () => game.newGame());

// Debug-hook bara i dev-bygget (inga globaler i produktion).
if (import.meta.env.DEV) (window as unknown as { __game?: Game }).__game = game;
