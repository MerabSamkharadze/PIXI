import { Card } from '../models/card.model';
import { GameConfig } from '../models/game-config.model';

export function buildDeck(config: GameConfig): Card[] {
  const total = config.rows * config.cols;
  if (total % 2 !== 0) {
    throw new Error('Memory board must have an even number of cells');
  }
  const pairsNeeded = total / 2;
  if (config.assetKeys.length < pairsNeeded) {
    throw new Error(`Need at least ${pairsNeeded} asset keys`);
  }

  const deck: Card[] = [];
  for (let i = 0; i < pairsNeeded; i++) {
    const key = config.assetKeys[i];
    deck.push(makeCard(deck.length, key), makeCard(deck.length + 1, key));
  }
  return shuffle(deck);
}

function makeCard(id: number, pairKey: string): Card {
  return { id, pairKey, assetKey: pairKey, state: 'hidden' };
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
