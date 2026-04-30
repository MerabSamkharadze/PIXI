import { Container, Graphics } from 'pixi.js';
import { Paddle } from '../../domain/models/playfield.model';
import { BreakoutConfig } from '../../domain/models/breakout-config.model';

export class PaddleRenderer {
  readonly view = new Container();
  private readonly bg = new Graphics();
  private readonly laserMarks = new Graphics();
  private currentWidth = 0;
  private targetWidth = 0;
  private height: number;
  private laserActive = false;
  private drawnWidth = -1;
  private drawnLaser = false;

  constructor(config: BreakoutConfig) {
    this.height = config.paddleHeight;
    this.currentWidth = config.paddleWidth;
    this.targetWidth = config.paddleWidth;
    this.view.addChild(this.bg, this.laserMarks);
    this.draw();
  }

  setPaddle(paddle: Paddle, paddleY: number): void {
    this.targetWidth = paddle.width;
    this.view.position.set(paddle.x, paddleY);
  }

  setLaserActive(active: boolean): void {
    if (this.laserActive === active) return;
    this.laserActive = active;
  }

  setConfig(config: BreakoutConfig): void {
    this.height = config.paddleHeight;
  }

  tick(deltaMs: number): void {
    const delta = this.targetWidth - this.currentWidth;
    if (Math.abs(delta) > 0.1) {
      const step = Math.sign(delta) * Math.min(Math.abs(delta), Math.abs(delta) * 0.18 + 0.05 * deltaMs);
      this.currentWidth += step;
    } else if (this.currentWidth !== this.targetWidth) {
      this.currentWidth = this.targetWidth;
    }
    if (this.currentWidth !== this.drawnWidth || this.laserActive !== this.drawnLaser) {
      this.draw();
    }
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private draw(): void {
    const w = this.currentWidth;
    const h = this.height;
    const half = w / 2;
    const r = h * 0.5;

    this.bg.clear();
    this.bg
      .roundRect(-half, 0, w, h, r)
      .fill({ color: 0xf59e0b, alpha: 0.95 })
      .stroke({ width: 1, color: 0xfde68a, alpha: 0.7 });
    this.bg
      .roundRect(-half + 2, 1, w - 4, h * 0.45, r - 1)
      .fill({ color: 0xffffff, alpha: 0.18 });

    this.laserMarks.clear();
    if (this.laserActive) {
      const tipY = -3;
      const baseY = 1;
      const positions = [-half + 8, half - 8];
      for (const x of positions) {
        this.laserMarks
          .moveTo(x, baseY)
          .lineTo(x - 3, tipY)
          .lineTo(x + 3, tipY)
          .closePath()
          .fill({ color: 0xef4444, alpha: 0.95 });
      }
    }

    this.drawnWidth = w;
    this.drawnLaser = this.laserActive;
  }
}
