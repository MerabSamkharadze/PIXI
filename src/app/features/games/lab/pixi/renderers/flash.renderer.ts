import { Graphics } from 'pixi.js';

const LIFE_MS = 480;
const PEAK_ALPHA = 0.45;

export class FlashRenderer {
  readonly view = new Graphics();
  private active = false;
  private elapsed = 0;
  private width = 0;
  private height = 0;
  private color = 0x22d3ee;

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.redraw();
  }

  trigger(color = 0x22d3ee): void {
    this.color = color;
    this.redraw();
    this.active = true;
    this.elapsed = 0;
    this.view.alpha = PEAK_ALPHA;
  }

  tick(deltaMs: number): void {
    if (!this.active) return;
    this.elapsed += deltaMs;
    const t = this.elapsed / LIFE_MS;
    if (t >= 1) {
      this.active = false;
      this.view.alpha = 0;
      return;
    }
    this.view.alpha = PEAK_ALPHA * (1 - t);
  }

  destroy(): void {
    this.view.destroy();
  }

  private redraw(): void {
    this.view.clear();
    if (this.width <= 0 || this.height <= 0) return;
    this.view
      .roundRect(0, 0, this.width, this.height, 14)
      .fill({ color: this.color, alpha: 1 });
    this.view.alpha = this.active ? PEAK_ALPHA : 0;
  }
}
