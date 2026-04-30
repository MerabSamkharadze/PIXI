import { Grid, Tile } from '../models/tile.model';
import { PuzzleConfig } from '../models/puzzle-config.model';

export function buildSolvedGrid(config: PuzzleConfig): { grid: Grid; emptyIndex: number } {
  const total = config.rows * config.cols;
  const tileCount = total - 1;
  if (config.assetKeys.length < tileCount) {
    throw new Error(`Need at least ${tileCount} asset keys`);
  }
  const grid: (Tile | null)[] = [];
  for (let i = 0; i < tileCount; i++) {
    grid.push({ id: i + 1, emoji: config.assetKeys[i], goalIndex: i });
  }
  grid.push(null);
  return { grid, emptyIndex: tileCount };
}

export function shuffleByMoves(
  grid: Grid,
  emptyIndex: number,
  moveCount: number,
  cols: number,
  rows: number
): { grid: Grid; emptyIndex: number } {
  const out: (Tile | null)[] = grid.slice();
  let empty = emptyIndex;
  let lastMoved = -1;

  for (let i = 0; i < moveCount; i++) {
    const candidates = neighborsOf(empty, cols, rows).filter(n => n !== lastMoved);
    if (candidates.length === 0) continue;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    [out[pick], out[empty]] = [out[empty], out[pick]];
    lastMoved = empty;
    empty = pick;
  }

  return { grid: out, emptyIndex: empty };
}

export function isAdjacent(a: number, b: number, cols: number): boolean {
  const ar = Math.floor(a / cols);
  const ac = a % cols;
  const br = Math.floor(b / cols);
  const bc = b % cols;
  return (ar === br && Math.abs(ac - bc) === 1) || (ac === bc && Math.abs(ar - br) === 1);
}

export function isSolved(grid: Grid): boolean {
  for (let i = 0; i < grid.length; i++) {
    const t = grid[i];
    if (t === null) continue;
    if (t.goalIndex !== i) return false;
  }
  return true;
}

function neighborsOf(idx: number, cols: number, rows: number): number[] {
  const r = Math.floor(idx / cols);
  const c = idx % cols;
  const out: number[] = [];
  if (r > 0) out.push(idx - cols);
  if (r < rows - 1) out.push(idx + cols);
  if (c > 0) out.push(idx - 1);
  if (c < cols - 1) out.push(idx + 1);
  return out;
}
