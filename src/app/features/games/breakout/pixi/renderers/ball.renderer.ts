import { Container, Graphics } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { Ball } from '../../domain/models/playfield.model';
import { BreakoutConfig } from '../../domain/models/breakout-config.model';

interface BallSlot {
  readonly g: Graphics;
  drawnRadius: number;
}

export class BallRenderer {
  readonly view = new Container();
  private readonly balls = new Map<number, BallSlot>();
  private readonly glow: GlowFilter;
  private config: BreakoutConfig;

  constructor(config: BreakoutConfig) {
    this.config = config;
    this.glow = new GlowFilter({
      distance: 12,
      outerStrength: 1.4,
      innerStrength: 0.2,
      color: 0xf59e0b,
      quality: 0.3
    });
    this.view.filters = [this.glow];
  }

  syncBalls(balls: readonly Ball[]): void {
    const seen = new Set<number>();
    for (const ball of balls) {
      seen.add(ball.id);
      let slot = this.balls.get(ball.id);
      if (!slot) {
        const g = new Graphics();
        slot = { g, drawnRadius: -1 };
        this.balls.set(ball.id, slot);
        this.view.addChild(g);
      }
      if (slot.drawnRadius !== this.config.ballRadius) {
        drawBall(slot.g, this.config.ballRadius);
        slot.drawnRadius = this.config.ballRadius;
      }
      slot.g.position.set(ball.pos.x, ball.pos.y);
    }
    this.balls.forEach((slot, id) => {
      if (!seen.has(id)) {
        slot.g.destroy();
        this.balls.delete(id);
      }
    });
  }

  setConfig(config: BreakoutConfig): void {
    if (config === this.config) return;
    this.config = config;
    this.balls.forEach(slot => {
      drawBall(slot.g, this.config.ballRadius);
      slot.drawnRadius = this.config.ballRadius;
    });
  }

  destroy(): void {
    this.balls.forEach(slot => slot.g.destroy());
    this.balls.clear();
    this.view.filters = null;
    this.glow.destroy();
    this.view.destroy({ children: true });
  }
}

function drawBall(g: Graphics, radius: number): void {
  g.clear();
  g.circle(0, 0, radius).fill({ color: 0xfde68a });
  g.circle(0, 0, radius * 0.55).fill({ color: 0xffffff, alpha: 0.85 });
}
