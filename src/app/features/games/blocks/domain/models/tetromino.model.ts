export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type RotIndex = 0 | 1 | 2 | 3;

export type RotDirection = 'cw' | 'ccw';

export const TETROMINO_TYPES: readonly TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const COLORS: Record<TetrominoType, number> = {
  I: 0x22d3ee,
  O: 0xfbbf24,
  T: 0xa855f7,
  S: 0xa3e635,
  Z: 0xef4444,
  J: 0x3b82f6,
  L: 0xfb923c
};

/** Bounding-box width for each piece (cols). I = 4, O = 4, others = 3. */
export const BOX: Record<TetrominoType, number> = {
  I: 4, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3
};

/**
 * Cells per rotation as [x, y] offsets from the piece's top-left origin.
 * Rotation 0 = spawn orientation. Order: 0 → CW → 180 → CCW.
 */
export const SHAPES: Record<TetrominoType, readonly (readonly (readonly [number, number])[])[]> = {
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]]
  ],
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]]
  ],
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [1, 2]]
  ],
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[1, 1], [2, 1], [0, 2], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]],
    [[2, 0], [1, 1], [2, 1], [1, 2]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[1, 0], [0, 1], [1, 1], [0, 2]]
  ],
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[1, 0], [1, 1], [0, 2], [1, 2]]
  ],
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]],
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [1, 1], [2, 1], [0, 2]],
    [[0, 0], [1, 0], [1, 1], [1, 2]]
  ]
};

/** SRS-lite wall-kick offsets for J/L/S/T/Z pieces. Five candidate offsets per direction. */
export const KICKS_JLSTZ: Record<RotDirection, readonly (readonly [number, number])[]> = {
  cw:  [[ 0, 0], [-1, 0], [-1, +1], [ 0, -2], [-1, -2]],
  ccw: [[ 0, 0], [+1, 0], [+1, +1], [ 0, -2], [+1, -2]]
};

/** I-piece kicks (different pivot). */
export const KICKS_I: Record<RotDirection, readonly (readonly [number, number])[]> = {
  cw:  [[ 0, 0], [-2, 0], [+1, 0], [-2, -1], [+1, +2]],
  ccw: [[ 0, 0], [+2, 0], [-1, 0], [+2, +1], [-1, -2]]
};
