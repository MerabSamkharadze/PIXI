import { Container, Graphics, Ticker } from 'pixi.js';
import { Grid } from '../../domain/models/tile.model';
import { PuzzleConfig, boardPixelSize } from '../../domain/models/puzzle-config.model';
import { TileRenderer } from './tile.renderer';

const PANEL_FILL = 0x0b1020;
const PANEL_STROKE = 0x22d3ee;

export class BoardRenderer {
  readonly view = new Container();
  private readonly bg = new Graphics();
  private readonly tilesLayer = new Container();
  private readonly tiles = new Map<number, TileRenderer>();
  private readonly ticker: Ticker;
  private config: PuzzleConfig;
  private lastGrid: Grid = [];

  constructor(
    config: PuzzleConfig,
    private readonly onTileClick: (id: number) => void
  ) {
    this.config = config;
    this.view.addChild(this.bg, this.tilesLayer);
    this.drawBackground();
    this.tilesLayer.position.set(config.boardPadding, config.boardPadding);

    this.ticker = new Ticker();
    this.ticker.add(t => this.tiles.forEach(r => r.tick(t.deltaMS)));
    this.ticker.start();
  }

  syncGrid(grid: Grid): void {
    const isFirstSync = this.lastGrid.length === 0;
    this.lastGrid = grid;
    const seen = new Set<number>();

    for (let i = 0; i < grid.length; i++) {
      const tile = grid[i];
      if (!tile) continue;
      seen.add(tile.id);
      const [x, y] = this.gridPos(i);

      let renderer = this.tiles.get(tile.id);
      if (!renderer) {
        renderer = new TileRenderer(tile, this.config.tileSize, this.config.slideMs, this.onTileClick);
        this.tiles.set(tile.id, renderer);
        this.tilesLayer.addChild(renderer.view);
        renderer.setPositionImmediate(x, y);
      } else if (isFirstSync) {
        renderer.setPositionImmediate(x, y);
      } else {
        renderer.setTargetPosition(x, y);
      }
      renderer.setCorrect(tile.goalIndex === i);
    }

    this.tiles.forEach((renderer, id) => {
      if (!seen.has(id)) {
        renderer.destroy();
        this.tiles.delete(id);
      }
    });
  }

  setConfig(config: PuzzleConfig): void {
    if (config === this.config) return;
    this.config = config;
    this.tilesLayer.position.set(config.boardPadding, config.boardPadding);
    this.tiles.forEach(r => r.setSize(config.tileSize));
    this.lastGrid.forEach((tile, idx) => {
      if (!tile) return;
      const [x, y] = this.gridPos(idx);
      this.tiles.get(tile.id)?.setPositionImmediate(x, y);
    });
    this.drawBackground();
  }

  boardSize(): { width: number; height: number } {
    return boardPixelSize(this.config);
  }

  destroy(): void {
    this.ticker.destroy();
    this.tiles.forEach(r => r.destroy());
    this.tiles.clear();
    this.view.destroy({ children: true });
  }

  private gridPos(idx: number): [number, number] {
    const { cols, tileSize, gap } = this.config;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return [col * (tileSize + gap), row * (tileSize + gap)];
  }

  private drawBackground(): void {
    const size = boardPixelSize(this.config);
    this.bg.clear();
    this.bg
      .roundRect(0, 0, size.width, size.height, 18)
      .fill({ color: PANEL_FILL, alpha: 0.55 })
      .stroke({ width: 2, color: PANEL_STROKE, alpha: 0.35 });

    const { cols, rows, tileSize, gap, boardPadding } = this.config;
    const slotR = 12;
    for (let i = 0; i < cols * rows; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = boardPadding + col * (tileSize + gap);
      const y = boardPadding + row * (tileSize + gap);
      this.bg
        .roundRect(x, y, tileSize, tileSize, slotR)
        .fill({ color: 0x06101e, alpha: 0.55 });
    }
  }
}
