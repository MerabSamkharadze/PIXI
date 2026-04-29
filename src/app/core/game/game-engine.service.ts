import { Injectable, Injector, inject } from '@angular/core';
import { Application, Container } from 'pixi.js';
import { BasePixiGame } from './base-pixi-game';
import { GameContext } from './game.types';

/**
 * Owns one PIXI.Application per route. A new game can be loaded onto the same
 * application; a route teardown calls destroy().
 */
@Injectable()
export class GameEngineService {
  private readonly injector = inject(Injector);
  private app: Application | null = null;
  private game: BasePixiGame | null = null;
  private host: HTMLElement | null = null;

  async start(host: HTMLElement, game: BasePixiGame, width: number, height: number): Promise<void> {
    if (this.game) await this.unload();

    if (!this.app) {
      const app = new Application();
      await app.init({
        width,
        height,
        antialias: true,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgl'
      });
      host.appendChild(app.canvas);
      this.app = app;
      this.host = host;
    } else {
      this.app.renderer.resize(width, height);
    }

    const stage = new Container();
    this.app.stage.addChild(stage);

    const ctx: GameContext = {
      app: this.app,
      stage,
      width,
      height,
      injector: this.injector
    };

    await game.mount(ctx);
    this.game = game;
  }

  resize(width: number, height: number): void {
    this.app?.renderer.resize(width, height);
    this.game?.resize(width, height);
  }

  async unload(): Promise<void> {
    this.game?.destroy();
    this.game = null;
    if (this.app) {
      this.app.stage.removeChildren();
    }
  }

  destroy(): void {
    this.game?.destroy();
    this.game = null;
    this.app?.destroy(true, { children: true, texture: false });
    this.app = null;
    this.host = null;
  }

  get application(): Application | null {
    return this.app;
  }
}
