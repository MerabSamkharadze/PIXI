export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Cell {
  readonly x: number;
  readonly y: number;
}

export interface Food extends Cell {
  readonly emoji: string;
  readonly hue: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'lost' | 'won';

export const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};

export const DELTA: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};
