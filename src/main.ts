import './style.css';
import './ui/ui.css';
import { Game } from './core/Game';
import type { GameModule } from './core/GameContext';
import { AudioModule, LoreBookModule, MapModule, MenuModule, SaveModule, WorldStateModule } from './index';
import { cryptoSeed } from './core/entropy';
import { LocaleManager } from './i18n';

/**
 * Moduler registreras här. Varje modul får GameContext (bus, hero, zone, session, data) via init().
 * LocaleManager före save så språkval kan läsas innan menyn visas.
 */
const i18n = new LocaleManager();
const save = new SaveModule(
  {
    loadHero: (s) => game.loadHero(s),
    getSnapshot: () => game.getSnapshot(),
    setSaveBackend: (b) => game.setSaveBackend(b),
  },
  undefined,
  true,
  cryptoSeed,
  i18n,
);
const modules: GameModule[] = [
  new WorldStateModule(),
  i18n,
  save,
  new MenuModule(save, i18n),
  new AudioModule(save),
  new MapModule(save, i18n),
  new LoreBookModule(save),
];

const host = document.getElementById('app');
if (!host) throw new Error('#app saknas');
const game = new Game(modules);
i18n.attachText(game.text);
if (import.meta.env.DEV || import.meta.env.VITE_CAPTURE_HOOK === 'true') {
  (window as unknown as { __game?: Game }).__game = game;
}
await game.start(host);
document.getElementById('newGame')?.addEventListener('click', () => game.newGame());
