import { Container, Graphics } from 'pixi.js';
import { SnakeConfig } from '../../domain/models/snake-config.model';

const PANEL_FILL = 0x0b1020;
const PANEL_STROKE = 0x4a6cf7;
const GRID_COLOR = 0x94a3b8;

export class ArenaRenderer {
  readonly view = new Container();
  private readonly bg = new Graphics();
  private config: SnakeConfig;

  constructor(config: SnakeConfig) {
    this.config = config;
    this.view.addChild(this.bg);
    this.draw();
  }

  setConfig(config: SnakeConfig): void {
    this.config = config;
    this.draw();
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private draw(): void {
    const { cols, rows, cellSize, boardPadding } = this.config;
    const w = cols * cellSize + boardPadding * 2;
    const h = rows * cellSize + boardPadding * 2;

    this.bg.clear();
    this.bg
      .roundRect(0, 0, w, h, 18)
      .fill({ color: PANEL_FILL, alpha: 0.55 })
      .stroke({ width: 2, color: PANEL_STROKE, alpha: 0.4 });

    for (let i = 1; i < cols; i++) {
      const x = boardPadding + i * cellSize;
      this.bg.moveTo(x, boardPadding).lineTo(x, boardPadding + rows * cellSize);
    }
    for (let i = 1; i < rows; i++) {
      const y = boardPadding + i * cellSize;
      this.bg.moveTo(boardPadding, y).lineTo(boardPadding + cols * cellSize, y);
    }
    this.bg.stroke({ width: 1, color: GRID_COLOR, alpha: 0.05 });
  }
}
