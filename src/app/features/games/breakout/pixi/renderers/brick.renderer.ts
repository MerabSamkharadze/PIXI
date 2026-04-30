import { Container, Graphics } from 'pixi.js';
import { BRICK_COLORS, Brick } from '../../domain/models/brick.model';

export class BrickRenderer {
  readonly view = new Container();
  private readonly bg = new Graphics();
  private readonly accent = new Graphics();
  private currentHp: number;
  private currentType: Brick['type'];
  private size: { w: number; h: number };
  private pulse = 0;

  constructor(brick: Brick, size: { w: number; h: number }) {
    this.currentHp = brick.hp;
    this.currentType = brick.type;
    this.size = size;
    this.view.addChild(this.bg, this.accent);
    this.draw();
  }

  update(brick: Brick, size: { w: number; h: number }): void {
    if (brick.hp === this.currentHp && brick.type === this.currentType
        && size.w === this.size.w && size.h === this.size.h) return;
    this.currentHp = brick.hp;
    this.currentType = brick.type;
    this.size = size;
    this.draw();
  }

  setPosition(x: number, y: number): void {
    this.view.position.set(x, y);
  }

  tick(deltaMs: number): void {
    if (this.currentType !== 'power') return;
    this.pulse = (this.pulse + deltaMs * 0.003) % (Math.PI * 2);
    this.accent.alpha = 0.35 + Math.sin(this.pulse) * 0.25;
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private draw(): void {
    const { w, h } = this.size;
    const r = Math.max(2, h * 0.2);
    const baseColor = BRICK_COLORS[this.currentType];

    this.bg.clear();
    this.accent.clear();

    if (this.currentType === 'steel') {
      this.bg
        .roundRect(0, 0, w, h, r)
        .fill({ color: 0x475569 })
        .stroke({ width: 1, color: 0x94a3b8, alpha: 0.6 });
      this.bg
        .moveTo(2, 2)
        .lineTo(w - 2, 2)
        .stroke({ width: 1, color: 0xe2e8f0, alpha: 0.35 });
      this.accent.alpha = 1;
      return;
    }

    const isCracked = this.currentType === 'tough' && this.currentHp === 1;
    const fillAlpha = isCracked ? 0.65 : 0.95;

    this.bg
      .roundRect(0, 0, w, h, r)
      .fill({ color: baseColor, alpha: fillAlpha })
      .stroke({ width: 1, color: baseColor, alpha: 1 });
    this.bg
      .moveTo(2, 1.5)
      .lineTo(w - 2, 1.5)
      .stroke({ width: 1, color: 0xffffff, alpha: 0.35 });

    if (isCracked) {
      this.bg
        .moveTo(w * 0.2, h * 0.4)
        .lineTo(w * 0.55, h * 0.85)
        .moveTo(w * 0.7, h * 0.25)
        .lineTo(w * 0.45, h * 0.7)
        .stroke({ width: 1.2, color: 0x0b1020, alpha: 0.7 });
    }

    if (this.currentType === 'power') {
      this.accent
        .roundRect(2, 2, w - 4, h - 4, r - 1)
        .stroke({ width: 1, color: 0xffffff, alpha: 1 });
      this.accent.alpha = 0.5;
    } else {
      this.accent.alpha = 1;
    }
  }
}
