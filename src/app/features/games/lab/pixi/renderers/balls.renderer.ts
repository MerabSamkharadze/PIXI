import { Container, Graphics } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { Ball } from '../../domain/models/element.model';
import { LabConfig } from '../../domain/models/lab-config.model';

interface BallSlot {
  readonly body: Graphics;
  readonly trail: Graphics;
}

export class BallsRenderer {
  readonly view = new Container();
  private readonly trailLayer = new Container();
  private readonly bodyLayer = new Container();
  private readonly slots = new Map<number, BallSlot>();
  private readonly glow: GlowFilter;
  private config: LabConfig;

  constructor(config: LabConfig) {
    this.config = config;
    this.glow = new GlowFilter({
      distance: 14,
      outerStrength: 1.6,
      innerStrength: 0.2,
      color: 0x22d3ee,
      quality: 0.3
    });
    this.bodyLayer.filters = [this.glow];
    this.view.addChild(this.trailLayer, this.bodyLayer);
  }

  syncBalls(balls: readonly Ball[]): void {
    const seen = new Set<number>();
    for (const b of balls) {
      seen.add(b.id);
      let slot = this.slots.get(b.id);
      if (!slot) {
        slot = this.createSlot();
        this.slots.set(b.id, slot);
      }
      this.drawBall(slot, b);
    }
    this.slots.forEach((slot, id) => {
      if (!seen.has(id)) {
        slot.body.destroy();
        slot.trail.destroy();
        this.slots.delete(id);
      }
    });
  }

  setConfig(config: LabConfig): void {
    if (config === this.config) return;
    this.config = config;
  }

  destroy(): void {
    this.slots.forEach(slot => {
      slot.body.destroy();
      slot.trail.destroy();
    });
    this.slots.clear();
    this.bodyLayer.filters = null;
    this.glow.destroy();
    this.view.destroy({ children: true });
  }

  private createSlot(): BallSlot {
    const body = new Graphics();
    const trail = new Graphics();
    this.bodyLayer.addChild(body);
    this.trailLayer.addChild(trail);
    return { body, trail };
  }

  private drawBall(slot: BallSlot, ball: Ball): void {
    const r = this.config.ballRadius;
    const fadeT = ball.fadeOutMs > 0 ? Math.min(1, ball.fadeOutMs / this.config.fadeOutMs) : 0;
    const alpha = 1 - fadeT;
    slot.body.clear();
    slot.body.circle(0, 0, r).fill({ color: 0xfde68a, alpha });
    slot.body.circle(0, 0, r * 0.55).fill({ color: 0xffffff, alpha: 0.85 * alpha });
    slot.body.position.set(ball.pos.x, ball.pos.y);

    slot.trail.clear();
    const n = ball.trail.length;
    for (let i = 0; i < n; i++) {
      const p = ball.trail[i];
      const t = (i + 1) / n;
      const pr = r * (0.3 + t * 0.55);
      slot.trail.circle(p.x, p.y, pr).fill({ color: 0x22d3ee, alpha: 0.18 * t * alpha });
    }
  }
}
