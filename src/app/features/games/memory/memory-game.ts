import { EffectRef, Injector, effect } from '@angular/core';
import { BasePixiGame } from '../../../core/game/base-pixi-game';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as MemoryRulesService } from './domain/services/game-engine.service';
import { BoardRenderer } from './pixi/renderers/board.renderer';
import { GameConfig, pickMemoryConfig } from './domain/models/game-config.model';

export class MemoryGame extends BasePixiGame {
  readonly id = 'memory';
  private board: BoardRenderer | null = null;
  private effectRef: EffectRef | null = null;
  private config: GameConfig;

  constructor(
    config: GameConfig,
    private readonly state: GameStateService,
    private readonly rules: MemoryRulesService,
    private readonly injector: Injector
  ) {
    super();
    this.config = config;
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
    const next = pickMemoryConfig(window.innerWidth);
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
}
