import { Container, Graphics } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { Piece } from '../../domain/models/playfield.model';
import { BlocksConfig } from '../../domain/models/blocks-config.model';
import { COLORS, SHAPES } from '../../domain/models/tetromino.model';
import { dropDistance } from '../../domain/services/rotation-system';
import { drawBlock, drawGhost } from './playfield.renderer';
import { Grid } from '../../domain/models/playfield.model';

export class ActivePieceRenderer {
  readonly view = new Container();
  private readonly pieceContainer = new Container();
  private readonly ghostContainer = new Container();
  private readonly pieceCells: Graphics[] = [];
  private readonly ghostCells: Graphics[] = [];
  private readonly glow: GlowFilter;
  private config: BlocksConfig;

  private currentPiece: Piece | null = null;
  private targetX = 0;
  private targetY = 0;
  private currentVisualX = 0;
  private currentVisualY = 0;
  private slideStart = -Infinity;
  private readonly slideMs = 70;

  constructor(config: BlocksConfig) {
    this.config = config;
    this.glow = new GlowFilter({
      distance: 12,
      outerStrength: 1.6,
      innerStrength: 0.2,
      color: 0xffffff,
      quality: 0.3
    });
    this.pieceContainer.filters = [this.glow];
    this.view.addChild(this.ghostContainer, this.pieceContainer);
    this.ensureCells(this.pieceCells, this.pieceContainer, 4);
    this.ensureCells(this.ghostCells, this.ghostContainer, 4);
  }

  setPiece(piece: Piece | null, grid: Grid, instant = false): void {
    if (piece === null) {
      this.pieceContainer.visible = false;
      this.ghostContainer.visible = false;
      this.currentPiece = null;
      return;
    }

    const sameShape = this.currentPiece
      && this.currentPiece.type === piece.type
      && this.currentPiece.rotation === piece.rotation;

    this.pieceContainer.visible = true;
    this.ghostContainer.visible = true;

    const color = COLORS[piece.type];
    this.glow.color = color;

    if (!sameShape) this.redrawShape(piece, color);

    const px = piece.x * this.config.cellSize;
    const py = (piece.y - this.config.hiddenRows) * this.config.cellSize;

    if (instant || this.currentPiece === null) {
      this.pieceContainer.position.set(px, py);
      this.currentVisualX = px;
      this.currentVisualY = py;
      this.targetX = px;
      this.targetY = py;
      this.slideStart = -Infinity;
    } else {
      this.currentVisualX = this.pieceContainer.position.x;
      this.currentVisualY = this.pieceContainer.position.y;
      this.targetX = px;
      this.targetY = py;
      this.slideStart = performance.now();
    }

    this.updateGhost(piece, grid, color);
    this.currentPiece = piece;
  }

  tick(_deltaMs: number): void {
    if (!Number.isFinite(this.slideStart)) return;
    const elapsed = performance.now() - this.slideStart;
    if (elapsed >= this.slideMs) {
      this.pieceContainer.position.set(this.targetX, this.targetY);
      this.slideStart = -Infinity;
      return;
    }
    const t = elapsed / this.slideMs;
    const eased = 1 - Math.pow(1 - t, 3);
    this.pieceContainer.position.set(
      this.currentVisualX + (this.targetX - this.currentVisualX) * eased,
      this.currentVisualY + (this.targetY - this.currentVisualY) * eased
    );
  }

  setConfig(config: BlocksConfig): void {
    if (config === this.config) return;
    this.config = config;
    if (this.currentPiece) {
      const piece = this.currentPiece;
      this.redrawShape(piece, COLORS[piece.type]);
    }
  }

  destroy(): void {
    this.pieceContainer.filters = null;
    this.glow.destroy();
    this.view.destroy({ children: true });
  }

  private redrawShape(piece: Piece, color: number): void {
    const cells = SHAPES[piece.type][piece.rotation];
    const size = this.config.cellSize;
    for (let i = 0; i < 4; i++) {
      const [dx, dy] = cells[i];
      const g = this.pieceCells[i];
      drawBlock(g, size, color);
      g.position.set(dx * size, dy * size);
    }
    for (let i = 0; i < 4; i++) {
      const [dx, dy] = cells[i];
      const g = this.ghostCells[i];
      drawGhost(g, size, color);
      g.position.set(dx * size, dy * size);
    }
  }

  private updateGhost(piece: Piece, grid: Grid, color: number): void {
    const dy = dropDistance(piece, grid);
    const px = piece.x * this.config.cellSize;
    const py = (piece.y + dy - this.config.hiddenRows) * this.config.cellSize;
    this.ghostContainer.position.set(px, py);
    if (dy === 0) {
      this.ghostContainer.visible = false;
    } else {
      this.ghostContainer.visible = true;
    }
    void color;
  }

  private ensureCells(arr: Graphics[], parent: Container, count: number): void {
    while (arr.length < count) {
      const g = new Graphics();
      parent.addChild(g);
      arr.push(g);
    }
  }
}
