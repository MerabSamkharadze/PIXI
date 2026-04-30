import { RotIndex, TetrominoType } from './tetromino.model';

export type Cell = TetrominoType | null;

export type Grid = readonly (readonly Cell[])[];

export interface Piece {
  readonly type: TetrominoType;
  readonly rotation: RotIndex;
  readonly x: number;
  readonly y: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'lost';
