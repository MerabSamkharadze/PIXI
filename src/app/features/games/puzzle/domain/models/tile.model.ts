export interface Tile {
  readonly id: number;
  readonly emoji: string;
  readonly goalIndex: number;
}

export type GamePhase = 'idle' | 'playing' | 'won';

export type Grid = readonly (Tile | null)[];
