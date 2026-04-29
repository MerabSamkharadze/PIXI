import { EffectRef, Injector, effect } from '@angular/core';
import { BasePixiGame } from '../../../core/game/base-pixi-game';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as MemoryRulesService } from './domain/services/game-engine.service';
import { BoardRenderer } from './pixi/renderers/board.renderer';
import { GameConfig } from './domain/models/game-config.model';

/**
 * Pixi-side of Memory: owns the BoardRenderer and reacts to state via effect().
 * Angular DOM/HUD lives in MemoryShell.
 */
export class MemoryGame extends BasePixiGame {
  readonly id = 'memory';
  private board: BoardRenderer | null = null;
  private effectRef: EffectRef | null = null;

  constructor(
    private readonly config: GameConfig,
    private readonly state: GameStateService,
    private readonly rules: MemoryRulesService,
    private readonly injector: Injector
  ) {
    super();
  }

  protected init(): void {
    const board = new BoardRenderer(this.config, id => this.rules.tryFlip(id));
    this.root.addChild(board.view);
    this.board = board;
    this.center();

    this.effectRef = effect(
      () => {
        const cards = this.state.cards();
        if (cards.length) board.syncCards(cards);
      },
      { injector: this.injector }
    );

    this.rules.start(this.config);
  }

  resize(width: number, height: number): void {
    if (!this.board) return;
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
}
