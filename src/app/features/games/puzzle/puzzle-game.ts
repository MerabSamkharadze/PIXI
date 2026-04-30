import { EffectRef, Injector, effect } from '@angular/core';
import { BasePixiGame } from '../../../core/game/base-pixi-game';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as PuzzleRulesService } from './domain/services/game-engine.service';
import { BoardRenderer } from './pixi/renderers/board.renderer';
import { PuzzleConfig, pickPuzzleConfig } from './domain/models/puzzle-config.model';

export class PuzzleGame extends BasePixiGame {
  readonly id = 'puzzle';
  private board: BoardRenderer | null = null;
  private effectRef: EffectRef | null = null;
  private config: PuzzleConfig;

  constructor(
    config: PuzzleConfig,
    private readonly state: GameStateService,
    private readonly rules: PuzzleRulesService,
    private readonly injector: Injector
  ) {
    super();
    this.config = config;
  }

  protected init(): void {
    const board = new BoardRenderer(this.config, id => this.handleTileClick(id));
    this.root.addChild(board.view);
    this.board = board;
    this.center();

    this.effectRef = effect(
      () => {
        const grid = this.state.grid();
        if (grid.length) board.syncGrid(grid);
      },
      { injector: this.injector }
    );

    this.rules.start(this.config);
  }

  resize(width: number, height: number): void {
    if (!this.board) return;
    const next = pickPuzzleConfig(window.innerWidth);
    if (next !== this.config) {
      this.config = next;
      this.board.setConfig(next);
    }
    const size = this.board.boardSize();
    this.board.view.position.set((width - size.width) / 2, (height - size.height) / 2);
  }

  protected onDestroy(): void {
    this.effectRef?.destroy();
    this.effectRef = null;
    this.board?.destroy();
    this.board = null;
  }

  private center(): void {
    if (!this.board) return;
    const size = this.board.boardSize();
    this.board.view.position.set(
      (this.ctx.width - size.width) / 2,
      (this.ctx.height - size.height) / 2
    );
  }

  private handleTileClick(tileId: number): void {
    const position = this.state.grid().findIndex(t => t?.id === tileId);
    if (position < 0) return;
    this.rules.tryMove(position);
  }
}
