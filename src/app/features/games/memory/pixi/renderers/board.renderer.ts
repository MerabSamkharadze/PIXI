import { Container, Ticker } from 'pixi.js';
import { Card } from '../../domain/models/card.model';
import { GameConfig } from '../../domain/models/game-config.model';
import { CardRenderer } from './card.renderer';

export class BoardRenderer {
  readonly view = new Container();
  private readonly cards = new Map<number, CardRenderer>();
  private readonly ticker: Ticker;

  constructor(
    private readonly config: GameConfig,
    private readonly onCardClick: (id: number) => void
  ) {
    this.ticker = new Ticker();
    this.ticker.add(t => this.cards.forEach(c => c.tick(t.deltaMS)));
    this.ticker.start();
  }

  syncCards(cards: readonly Card[]): void {
    const seen = new Set<number>();
    cards.forEach((card, idx) => {
      seen.add(card.id);
      let renderer = this.cards.get(card.id);
      if (!renderer) {
        renderer = new CardRenderer(card, this.config.cardSize, this.onCardClick);
        this.cards.set(card.id, renderer);
        this.view.addChild(renderer.view);
      }
      renderer.setState(card.state);
      renderer.setPosition(...this.gridPos(idx));
    });

    this.cards.forEach((renderer, id) => {
      if (!seen.has(id)) {
        renderer.destroy();
        this.cards.delete(id);
      }
    });
  }

  boardSize(): { width: number; height: number } {
    const { cols, rows, cardSize, gap } = this.config;
    return {
      width: cols * cardSize + (cols - 1) * gap,
      height: rows * cardSize + (rows - 1) * gap
    };
  }

  destroy(): void {
    this.ticker.destroy();
    this.cards.forEach(c => c.destroy());
    this.cards.clear();
    this.view.destroy({ children: true });
  }

  private gridPos(idx: number): [number, number] {
    const { cols, cardSize, gap } = this.config;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return [col * (cardSize + gap), row * (cardSize + gap)];
  }
}
