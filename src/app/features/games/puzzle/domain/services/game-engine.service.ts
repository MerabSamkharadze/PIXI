import { Injectable, inject } from '@angular/core';
import { GameStateService } from '../state/game-state.service';
import { PuzzleConfig } from '../models/puzzle-config.model';
import { buildSolvedGrid, isAdjacent, isSolved, shuffleByMoves } from './shuffler';

@Injectable()
export class GameEngineService {
  private readonly state = inject(GameStateService);

  start(config: PuzzleConfig): void {
    const solved = buildSolvedGrid(config);
    const shuffled = shuffleByMoves(
      solved.grid,
      solved.emptyIndex,
      config.shuffleMoves,
      config.cols,
      config.rows
    );
    this.state.init(config, shuffled.grid, shuffled.emptyIndex);
  }

  tryMove(tilePosition: number): void {
    if (!this.state.isPlaying()) return;
    const config = this.state.config();
    if (!config) return;
    const empty = this.state.emptyIndex();
    if (!isAdjacent(tilePosition, empty, config.cols)) return;

    this.state.applyMove(tilePosition, empty);

    if (isSolved(this.state.grid())) {
      this.state.markWon();
    }
  }
}
