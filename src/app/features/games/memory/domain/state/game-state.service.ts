import { Injectable, computed, signal } from '@angular/core';
import { Card, CardId } from '../models/card.model';
import { GameConfig, GamePhase } from '../models/game-config.model';

@Injectable()
export class GameStateService {
  private readonly _config = signal<GameConfig | null>(null);
  private readonly _cards = signal<readonly Card[]>([]);
  private readonly _flipped = signal<readonly CardId[]>([]);
  private readonly _phase = signal<GamePhase>('idle');
  private readonly _moves = signal(0);
  private readonly _matches = signal(0);
  private readonly _startedAt = signal<number | null>(null);

  readonly config = this._config.asReadonly();
  readonly cards = this._cards.asReadonly();
  readonly flipped = this._flipped.asReadonly();
  readonly phase = this._phase.asReadonly();
  readonly moves = this._moves.asReadonly();
  readonly matches = this._matches.asReadonly();
  readonly startedAt = this._startedAt.asReadonly();

  readonly totalPairs = computed(() => Math.floor(this._cards().length / 2));
  readonly isWon = computed(() => this._phase() === 'won');

  init(config: GameConfig, cards: readonly Card[]): void {
    this._config.set(config);
    this._cards.set(cards);
    this._flipped.set([]);
    this._moves.set(0);
    this._matches.set(0);
    this._phase.set('playing');
    this._startedAt.set(performance.now());
  }

  setCardState(id: CardId, state: Card['state']): void {
    this._cards.update(list =>
      list.map(c => (c.id === id ? { ...c, state } : c))
    );
  }

  setFlipped(ids: readonly CardId[]): void {
    this._flipped.set(ids);
  }

  setPhase(phase: GamePhase): void {
    this._phase.set(phase);
  }

  incrementMoves(): void {
    this._moves.update(n => n + 1);
  }

  incrementMatches(): void {
    this._matches.update(n => n + 1);
  }

  cardById(id: CardId): Card | undefined {
    return this._cards().find(c => c.id === id);
  }
}
