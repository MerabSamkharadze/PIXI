import { Container, Graphics, Text } from 'pixi.js';
import { Tile } from '../../domain/models/tile.model';

const TILE_FILL = 0x0f1a33;
const TILE_STROKE = 0x2a3a66;
const TILE_STROKE_CORRECT = 0x22d3ee;

export class TileRenderer {
  readonly view = new Container();
  private readonly bg = new Graphics();
  private readonly label: Text;
  private size: number;
  private readonly slideMs: number;

  private targetX = 0;
  private targetY = 0;
  private slideOriginX = 0;
  private slideOriginY = 0;
  private slideStart = -Infinity;

  private isCorrect = false;
  private drawnSize = -1;
  private drawnCorrect = false;

  constructor(
    readonly tile: Tile,
    size: number,
    slideMs: number,
    private readonly onClick: (id: number) => void
  ) {
    this.size = size;
    this.slideMs = slideMs;
    this.view.eventMode = 'static';
    this.view.cursor = 'pointer';
    this.view.pivot.set(size / 2, size / 2);
    this.view.on('pointertap', () => this.onClick(this.tile.id));
    this.view.on('pointerover', () => this.hover(true));
    this.view.on('pointerout', () => this.hover(false));

    this.label = new Text({
      text: tile.emoji,
      style: {
        fontFamily: [
          '"Segoe UI Emoji"',
          '"Apple Color Emoji"',
          '"Noto Color Emoji"',
          'system-ui',
          'sans-serif'
        ],
        fontSize: size * 0.6,
        fill: 0xffffff,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          alpha: 0.55,
          blur: 6,
          angle: Math.PI / 4,
          distance: 3
        }
      }
    });
    this.label.anchor.set(0.5);
    this.label.position.set(size / 2, size / 2);

    this.view.addChild(this.bg, this.label);
    this.draw();
  }

  setSize(size: number): void {
    if (size === this.size) return;
    this.size = size;
    this.view.pivot.set(size / 2, size / 2);
    this.label.style.fontSize = size * 0.6;
    this.label.position.set(size / 2, size / 2);
    this.draw();
  }

  /** Position is the slot's top-left. View is pivot-centered, so internal position = top-left + size/2. */
  setPositionImmediate(x: number, y: number): void {
    const cx = x + this.size / 2;
    const cy = y + this.size / 2;
    this.view.position.set(cx, cy);
    this.targetX = cx;
    this.targetY = cy;
    this.slideStart = -Infinity;
  }

  setTargetPosition(x: number, y: number): void {
    const cx = x + this.size / 2;
    const cy = y + this.size / 2;
    if (this.targetX === cx && this.targetY === cy) return;
    this.slideOriginX = this.view.position.x;
    this.slideOriginY = this.view.position.y;
    this.targetX = cx;
    this.targetY = cy;
    this.slideStart = performance.now();
  }

  setCorrect(correct: boolean): void {
    if (correct === this.isCorrect) return;
    this.isCorrect = correct;
    this.draw();
  }

  tick(_deltaMs: number): void {
    if (!Number.isFinite(this.slideStart)) return;
    const elapsed = performance.now() - this.slideStart;
    if (elapsed >= this.slideMs) {
      this.view.position.set(this.targetX, this.targetY);
      this.slideStart = -Infinity;
      return;
    }
    const t = elapsed / this.slideMs;
    const eased = 1 - Math.pow(1 - t, 3);
    this.view.position.set(
      this.slideOriginX + (this.targetX - this.slideOriginX) * eased,
      this.slideOriginY + (this.targetY - this.slideOriginY) * eased
    );
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private draw(): void {
    if (this.drawnSize === this.size && this.drawnCorrect === this.isCorrect) return;
    const r = 14;
    const s = this.size;
    const stroke = this.isCorrect ? TILE_STROKE_CORRECT : TILE_STROKE;
    const strokeWidth = this.isCorrect ? 3 : 2;
    const strokeAlpha = this.isCorrect ? 0.95 : 0.7;

    this.bg.clear();
    this.bg
      .roundRect(0, 0, s, s, r)
      .fill({ color: TILE_FILL, alpha: 0.95 })
      .stroke({ width: strokeWidth, color: stroke, alpha: strokeAlpha });

    if (this.isCorrect) {
      this.bg
        .roundRect(2, 2, s - 4, s - 4, r - 2)
        .stroke({ width: 1, color: TILE_STROKE_CORRECT, alpha: 0.35 });
    }

    this.drawnSize = this.size;
    this.drawnCorrect = this.isCorrect;
  }

  private hover(active: boolean): void {
    this.view.scale.set(active ? 1.04 : 1);
  }
}
