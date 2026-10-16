import { Graphics, Text } from 'pixi.js';
import { EventBus } from './EventBus';
import type { GameEvents } from './events';
import { Session } from './Session';
import { validateData } from '../data';
import { Iso } from '../render/Iso';
import { Renderer } from '../render/Renderer';
import { SaveManager } from '../save/SaveManager';
import { SpawnSystem } from '../systems/SpawnSystem';

/**
 * Toppnivå: äger bussen, renderaren och systemen. Inga globala variabler; allt nås via Game-instansen.
 * PR 1 (skelett): startar renderaren och visar en förhandsvisning av D2-spawnen i isometrisk vy.
 * PR 2 lägger till Input, Camera, Hero/Monster, LootSystem, Inventory, Tooltip, MonsterBar, AudioManager, MapUI, Lorebook.
 */
export class Game {
  readonly bus = new EventBus<GameEvents>();
  readonly renderer = new Renderer();
  readonly saves = new SaveManager();
  readonly spawn = new SpawnSystem();
  session = new Session();

  async start(host: HTMLElement): Promise<void> {
    const issues = validateData();
    if (issues.length) console.warn('Datavarningar:', issues);
    await this.renderer.init(host);
    this.preview();
  }

  newGame(): void {
    this.session = new Session();
    this.bus.emit('new_game', { seed: this.session.seed });
    this.preview();
  }

  /** Tillfällig vy: rutnät för Startskogen och dess genererade monster (prickar, färg efter elit). */
  private preview(): void {
    const r = this.renderer;
    r.ground.removeChildren();
    r.objects.removeChildren();
    const g = new Graphics();
    const N = 22;
    for (let i = -N; i < N; i++)
      for (let j = -N; j < N; j++) {
        const { x, y } = Iso.toScreen(i, j);
        const shade = (i * 7 + j * 13) & 3;
        g.poly([x, y - 32, x + 64, y, x, y + 32, x - 64, y]).fill([0x26301f, 0x2b3522, 0x232c1d, 0x2e3824][shade] ?? 0x26301f);
      }
    r.ground.addChild(g);
    const specs = this.spawn.roll(this.spawn.area('startskogen'), this.session);
    const scale = 0.25; // världsenheter → rutor i förhandsvisningen
    for (const s of specs) {
      const { x, y } = Iso.toScreen(s.pos[0] * scale, s.pos[1] * scale);
      const c = s.elite === 'unik' ? 0xc7a35a : s.elite ? 0x6a6aff : 0xb8323c;
      const dot = new Graphics().ellipse(0, 0, 14, 7).fill({ color: 0x000000, alpha: 0.4 }).circle(0, -14, 9).fill(c);
      dot.position.set(x, y);
      dot.zIndex = Iso.depth(s.pos[0], s.pos[1]);
      r.objects.addChild(dot);
    }
    const label = new Text({
      text: `2D-motor under uppbyggnad · seed ${this.session.seed} · ${specs.length} monster`,
      style: { fontFamily: 'Cinzel, Georgia, serif', fontSize: 18, fill: 0xe6dfcc },
    });
    label.position.set(-label.width / 2, -N * 32 - 40);
    r.objects.addChild(label);
    r.world.position.set(r.width / 2, r.height / 2);
    r.world.scale.set(0.6);
  }
}
