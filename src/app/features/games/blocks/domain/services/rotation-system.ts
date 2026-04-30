import {
  KICKS_I,
  KICKS_JLSTZ,
  RotDirection,
  RotIndex,
  SHAPES
} from '../models/tetromino.model';
import { Cell, Grid, Piece } from '../models/playfield.model';

export function pieceCells(piece: Piece): readonly (readonly [number, number])[] {
  const cells = SHAPES[piece.type][piece.rotation];
  return cells.map(([dx, dy]) => [piece.x + dx, piece.y + dy] as const);
}

export function canPlace(piece: Piece, grid: Grid): boolean {
  const cells = SHAPES[piece.type][piece.rotation];
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  for (const [dx, dy] of cells) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (x < 0 || x >= cols) return false;
    if (y < 0) continue;
    if (y >= rows) return false;
    if (grid[y][x] !== null) return false;
  }
  return true;
}

export function tryRotate(piece: Piece, direction: RotDirection, grid: Grid): Piece | null {
  if (piece.type === 'O') return piece;

  const newRotation = (((piece.rotation + (direction === 'cw' ? 1 : 3)) % 4) as RotIndex);
  const kicks = piece.type === 'I' ? KICKS_I[direction] : KICKS_JLSTZ[direction];

  for (const [dx, dy] of kicks) {
    const candidate: Piece = {
      ...piece,
      rotation: newRotation,
      x: piece.x + dx,
      y: piece.y + dy
    };
    if (canPlace(candidate, grid)) return candidate;
  }

  return null;
}

export function dropDistance(piece: Piece, grid: Grid): number {
  let dy = 0;
  while (canPlace({ ...piece, y: piece.y + dy + 1 }, grid)) dy++;
  return dy;
}

export function lockPieceIntoGrid(piece: Piece, grid: Grid): Grid {
  const next: Cell[][] = grid.map(row => row.slice());
  for (const [dx, dy] of SHAPES[piece.type][piece.rotation]) {
    const x = piece.x + dx;
    const y = piece.y + dy;
    if (y >= 0 && y < next.length && x >= 0 && x < next[0].length) {
      next[y][x] = piece.type;
    }
  }
  return next;
}
