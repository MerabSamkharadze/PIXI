import { Cell, Grid } from '../models/playfield.model';

const LINE_SCORE: Record<number, number> = {
  1: 100,
  2: 300,
  3: 500,
  4: 800
};

export function detectFullLines(grid: Grid): readonly number[] {
  const out: number[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    if (row.every(c => c !== null)) out.push(y);
  }
  return out;
}

export function clearAndCollapse(grid: Grid, lines: readonly number[]): Grid {
  if (lines.length === 0) return grid;
  const cols = grid[0].length;
  const cleared = new Set(lines);
  const next: Cell[][] = [];

  const empty: Cell[] = Array(cols).fill(null);
  for (let i = 0; i < lines.length; i++) next.push(empty.slice());

  for (let y = 0; y < grid.length; y++) {
    if (!cleared.has(y)) next.push(grid[y].slice());
  }

  return next;
}

export function scoreFor(linesCleared: number, level: number): number {
  return (LINE_SCORE[linesCleared] ?? 0) * level;
}

export function comboScore(comboCount: number, level: number): number {
  if (comboCount <= 0) return 0;
  return 50 * level * comboCount;
}
