import { TETROMINO_TYPES, TetrominoType } from '../models/tetromino.model';

export class TetrominoBag {
  private bag: TetrominoType[] = [];

  next(): TetrominoType {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop() as TetrominoType;
  }

  peek(n: number): TetrominoType[] {
    while (this.bag.length < n) this.refill();
    return this.bag.slice(-n).reverse();
  }

  reset(): void {
    this.bag = [];
  }

  private refill(): void {
    const fresh = TETROMINO_TYPES.slice();
    for (let i = fresh.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
    }
    this.bag = fresh.concat(this.bag);
  }
}
