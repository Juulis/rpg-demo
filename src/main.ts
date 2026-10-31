import './style.css';
import './ui/ui.css';
import { Game } from './core/Game';
import type { GameModule } from './core/GameContext';
import { AudioModule, LoreBookModule, MapModule, MenuModule, SaveModule, WorldStateModule } from './index';
import { cryptoSeed } from './core/entropy';
import { LocaleManager } from './i18n';
import { smokeMetricsEnabled, captureSmokeHooksEnabled } from './dev/smokeGate';

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

if (smokeMetricsEnabled()) {
  const smoke: { moveHeroBy(dx: number, dy: number): void; teleportWorld?(x: number, y: number): void } = {
    moveHeroBy(dx, dy) {
      const w = game.state;
      if (!w?.hero.s.playing) return;
      w.hero.moveTarget = { x: w.hero.pos.x + dx, y: w.hero.pos.y + dy };
    },
  };
  if (captureSmokeHooksEnabled()) {
    smoke.teleportWorld = (x, y) => {
      const w = game.state;
      if (!w?.hero.s.playing) return;
      w.hero.pos.x = x;
      w.hero.pos.y = y;
      w.hero.moveTarget = null;
      w.zone.collide(w.hero.pos, 0.5);
    };
  }
  (window as unknown as { __smoke?: typeof smoke }).__smoke = smoke;
}
