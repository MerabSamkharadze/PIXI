import { Injectable, inject } from '@angular/core';
import { GameStateService } from '../state/game-state.service';
import { CardId } from '../models/card.model';
import { GameConfig } from '../models/game-config.model';
import { buildDeck } from './shuffler';

const MISMATCH_HOLD_MS = 700;

@Injectable()
export class GameEngineService {
  private readonly state = inject(GameStateService);

  start(config: GameConfig): void {
    this.state.init(config, buildDeck(config));
  }

  tryFlip(id: CardId): void {
    if (this.state.phase() !== 'playing') return;

    const card = this.state.cardById(id);
    if (!card || card.state !== 'hidden') return;

    this.state.setCardState(id, 'revealed');
    const flipped = [...this.state.flipped(), id];
    this.state.setFlipped(flipped);

    if (flipped.length === 2) {
      this.state.incrementMoves();
      this.resolvePair(flipped[0], flipped[1]);
    }
  }

  private resolvePair(a: CardId, b: CardId): void {
    const cardA = this.state.cardById(a);
    const cardB = this.state.cardById(b);
    if (!cardA || !cardB) return;

    if (cardA.pairKey === cardB.pairKey) {
      this.state.setCardState(a, 'matched');
      this.state.setCardState(b, 'matched');
      this.state.incrementMatches();
      this.state.setFlipped([]);

      if (this.state.matches() === this.state.totalPairs()) {
        this.state.markWon();
      }
      return;
    }

    this.state.setPhase('locked');
    setTimeout(() => {
      this.state.setCardState(a, 'hidden');
      this.state.setCardState(b, 'hidden');
      this.state.setFlipped([]);
      this.state.setPhase('playing');
    }, MISMATCH_HOLD_MS);
  }
}
