import { Container, Ticker } from 'pixi.js';
import { Brick } from '../../domain/models/brick.model';
import { BreakoutConfig, brickRect } from '../../domain/models/breakout-config.model';
import { BrickRenderer } from './brick.renderer';

export class BricksLayerRenderer {
  readonly view = new Container();
  private readonly bricks = new Map<number, BrickRenderer>();
  private readonly ticker = new Ticker();
  private config: BreakoutConfig;

  constructor(config: BreakoutConfig) {
    this.config = config;
    this.ticker.add(t => this.bricks.forEach(b => b.tick(t.deltaMS)));
    this.ticker.start();
  }

  syncBricks(bricks: readonly Brick[]): void {
    const seen = new Set<number>();
    for (const brick of bricks) {
      seen.add(brick.id);
      const rect = brickRect(this.config, brick.col, brick.row);
      let renderer = this.bricks.get(brick.id);
      if (!renderer) {
        renderer = new BrickRenderer(brick, { w: rect.w, h: rect.h });
        this.bricks.set(brick.id, renderer);
        this.view.addChild(renderer.view);
        renderer.setPosition(rect.x, rect.y);
      } else {
        renderer.update(brick, { w: rect.w, h: rect.h });
        renderer.setPosition(rect.x, rect.y);
      }
    }
    this.bricks.forEach((renderer, id) => {
      if (!seen.has(id)) {
        renderer.destroy();
        this.bricks.delete(id);
      }
    });
  }

  setConfig(config: BreakoutConfig): void {
    if (config === this.config) return;
    this.config = config;
  }

  destroy(): void {
    this.ticker.destroy();
    this.bricks.forEach(b => b.destroy());
    this.bricks.clear();
    this.view.destroy({ children: true });
  }
}
