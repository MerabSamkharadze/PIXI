import { Container, Graphics } from 'pixi.js';
import { Cell, Grid } from '../../domain/models/playfield.model';
import { BlocksConfig } from '../../domain/models/blocks-config.model';
import { COLORS, TetrominoType } from '../../domain/models/tetromino.model';

interface BlockCell {
  readonly g: Graphics;
  drawnType: TetrominoType | null;
  drawnSize: number;
}

export class PlayfieldRenderer {
  readonly view = new Container();
  private readonly cells: BlockCell[][] = [];
  private config: BlocksConfig;

  constructor(config: BlocksConfig) {
    this.config = config;
  }

  syncGrid(grid: Grid): void {
    const { cols, hiddenRows, cellSize } = this.config;
    const totalRows = grid.length;
    this.ensureGrid(totalRows, cols);

    for (let y = 0; y < totalRows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        const slot = this.cells[y][x];
        if (cell !== slot.drawnType || slot.drawnSize !== cellSize) {
          if (cell === null) {
            slot.g.clear();
          } else {
            drawBlock(slot.g, cellSize, COLORS[cell]);
          }
          slot.drawnType = cell;
          slot.drawnSize = cellSize;
        }
        const px = x * cellSize;
        const py = (y - hiddenRows) * cellSize;
        slot.g.position.set(px, py);
      }
    }
  }

  setConfig(config: BlocksConfig): void {
    if (config === this.config) return;
    this.config = config;
    this.cells.forEach(row => row.forEach(c => {
      c.drawnSize = -1;
      c.drawnType = null;
      c.g.clear();
    }));
  }

  destroy(): void {
    this.cells.length = 0;
    this.view.destroy({ children: true });
  }

  private ensureGrid(rows: number, cols: number): void {
    while (this.cells.length < rows) {
      const row: BlockCell[] = [];
      for (let x = 0; x < cols; x++) {
        const g = new Graphics();
        this.view.addChild(g);
        row.push({ g, drawnType: null, drawnSize: -1 });
      }
      this.cells.push(row);
    }
    while (this.cells.length > rows) {
      const row = this.cells.pop();
      row?.forEach(c => c.g.destroy());
    }
    for (const row of this.cells) {
      while (row.length < cols) {
        const g = new Graphics();
        this.view.addChild(g);
        row.push({ g, drawnType: null, drawnSize: -1 });
      }
      while (row.length > cols) {
        const c = row.pop();
        c?.g.destroy();
      }
    }
  }
}

export function drawBlock(g: Graphics, size: number, color: number): void {
  const r = Math.max(2, size * 0.18);
  const inset = Math.max(1, size * 0.08);
  g.clear();
  g.roundRect(0, 0, size, size, r)
    .fill({ color, alpha: 0.9 });
  g.roundRect(inset, inset, size - inset * 2, size - inset * 2, r * 0.7)
    .stroke({ width: 1, color: 0xffffff, alpha: 0.18 });
  g.roundRect(0, 0, size, size, r)
    .stroke({ width: 1.4, color, alpha: 1 });
}

export function drawGhost(g: Graphics, size: number, color: number): void {
  const r = Math.max(2, size * 0.18);
  g.clear();
  g.roundRect(1, 1, size - 2, size - 2, r)
    .stroke({ width: 1.5, color, alpha: 0.55 });
}
