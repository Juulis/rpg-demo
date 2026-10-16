import { Application, Container } from 'pixi.js';

/** Äger PixiJS-applikationen och scenlagren (bakgrund → mark → objekt → effekter). */
export class Renderer {
  readonly app = new Application();
  readonly background = new Container();
  readonly ground = new Container();
  readonly objects = new Container();
  readonly effects = new Container();
  /** Världen (mark, objekt, effekter) flyttas av kameran; bakgrunden ligger fast (parallax sköts separat). */
  readonly world = new Container();

  async init(host: HTMLElement): Promise<void> {
    await this.app.init({
      resizeTo: window,
      background: 0x0d0f12,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(devicePixelRatio, 2),
    });
    host.appendChild(this.app.canvas);
    this.objects.sortableChildren = true;
    this.world.addChild(this.ground, this.objects, this.effects);
    this.app.stage.addChild(this.background, this.world);
  }

  get width(): number {
    return this.app.screen.width;
  }

  get height(): number {
    return this.app.screen.height;
  }

  destroy(): void {
    this.app.destroy(true, { children: true });
  }
}
