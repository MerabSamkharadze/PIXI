export type CardId = number;

export interface Card {
  readonly id: CardId;
  readonly pairKey: string;
  readonly assetKey: string;
  state: CardState;
}

export type CardState = 'hidden' | 'revealed' | 'matched';
