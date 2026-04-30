import { Container, Graphics } from 'pixi.js';
import { BlocksConfig, fieldPixelSize } from '../../domain/models/blocks-config.model';

const PANEL_FILL = 0x0b1020;
const PANEL_STROKE = 0xec4899;
const GRID_LINE = 0x1f2a4a;

export class ArenaRenderer {
  readonly view = new Container();
  private readonly bg = new Graphics();
  private readonly mask = new Graphics();
  private config: BlocksConfig;

  constructor(config: BlocksConfig) {
    this.config = config;
    this.view.addChild(this.bg);
    this.draw();
  }

  /** A clipping mask to hide the hidden spawn rows. Add other layers as children of `mask` consumers. */
  buildMask(): Graphics {
    const size = this.visibleInnerSize();
    this.mask.clear();
    this.mask
      .rect(this.config.fieldPadding, this.config.fieldPadding, size.width, size.height)
      .fill({ color: 0xffffff });
    return this.mask;
  }

  setConfig(config: BlocksConfig): void {
    if (config === this.config) return;
    this.config = config;
    this.draw();
  }

  destroy(): void {
    this.view.destroy({ children: true });
    this.mask.destroy();
  }

  private draw(): void {
    const size = fieldPixelSize(this.config);
    const inner = this.visibleInnerSize();
    const { fieldPadding, cellSize, cols, rows } = this.config;

    this.bg.clear();
    this.bg
      .roundRect(0, 0, size.width, size.height, 16)
      .fill({ color: PANEL_FILL, alpha: 0.7 })
      .stroke({ width: 2, color: PANEL_STROKE, alpha: 0.5 });

    for (let c = 1; c < cols; c++) {
      const x = fieldPadding + c * cellSize;
      this.bg.moveTo(x, fieldPadding).lineTo(x, fieldPadding + inner.height);
    }
    for (let r = 1; r < rows; r++) {
      const y = fieldPadding + r * cellSize;
      this.bg.moveTo(fieldPadding, y).lineTo(fieldPadding + inner.width, y);
    }
    this.bg.stroke({ width: 1, color: GRID_LINE, alpha: 0.35 });
  }

  private visibleInnerSize(): { width: number; height: number } {
    return {
      width: this.config.cols * this.config.cellSize,
      height: this.config.rows * this.config.cellSize
    };
  }
}
