import { Container } from 'pixi.js';
import { GameContext } from './game.types';

export abstract class BasePixiGame {
  abstract readonly id: string;

  protected ctx!: GameContext;
  protected root!: Container;

  async mount(ctx: GameContext): Promise<void> {
    this.ctx = ctx;
    this.root = new Container();
    ctx.stage.addChild(this.root);
    await this.init();
  }

  destroy(): void {
    try {
      this.onDestroy();
    } finally {
      this.root?.destroy({ children: true });
    }
  }

  protected abstract init(): Promise<void> | void;
  abstract resize(width: number, height: number): void;
  protected abstract onDestroy(): void;
}
