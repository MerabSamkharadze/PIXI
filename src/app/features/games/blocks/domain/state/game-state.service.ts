import { Injectable, computed, signal } from '@angular/core';
import { GameStatus, Grid, Piece } from '../models/playfield.model';
import { TetrominoType } from '../models/tetromino.model';

export interface ClearedCell {
  readonly x: number;
  readonly y: number;
  readonly type: TetrominoType;
}

export interface LastClear {
  readonly id: number;
  readonly lines: number;
  readonly isTetris: boolean;
  readonly combo: number;
  readonly cells: readonly ClearedCell[];
}
import { BlocksConfig, gravityForLevel } from '../models/blocks-config.model';

const BEST_KEY = 'pixi.blocks.bestScore';

function emptyGrid(rows: number, cols: number): Grid {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

@Injectable()
export class GameStateService {
  private readonly _config = signal<BlocksConfig | null>(null);
  private readonly _grid = signal<Grid>([]);
  private readonly _activePiece = signal<Piece | null>(null);
  private readonly _hold = signal<TetrominoType | null>(null);
  private readonly _holdLocked = signal(false);
  private readonly _nextQueue = signal<readonly TetrominoType[]>([]);
  private readonly _status = signal<GameStatus>('idle');
  private readonly _score = signal(0);
  private readonly _lines = signal(0);
  private readonly _level = signal(1);
  private readonly _combo = signal(-1);
  private readonly _lastClear = signal<LastClear>({ id: 0, lines: 0, isTetris: false, combo: 0, cells: [] });
  private readonly _bestScore = signal<number>(loadBest());
  private readonly _startedAt = signal<number | null>(null);
  private readonly _finishedAt = signal<number | null>(null);
  private readonly _shakeId = signal(0);

  readonly config = this._config.asReadonly();
  readonly grid = this._grid.asReadonly();
  readonly activePiece = this._activePiece.asReadonly();
  readonly hold = this._hold.asReadonly();
  readonly holdLocked = this._holdLocked.asReadonly();
  readonly nextQueue = this._nextQueue.asReadonly();
  readonly status = this._status.asReadonly();
  readonly score = this._score.asReadonly();
  readonly lines = this._lines.asReadonly();
  readonly level = this._level.asReadonly();
  readonly combo = this._combo.asReadonly();
  readonly lastClear = this._lastClear.asReadonly();
  readonly bestScore = this._bestScore.asReadonly();
  readonly startedAt = this._startedAt.asReadonly();
  readonly finishedAt = this._finishedAt.asReadonly();
  readonly shakeId = this._shakeId.asReadonly();

  readonly isPlaying = computed(() => this._status() === 'playing');
  readonly isPaused = computed(() => this._status() === 'paused');
  readonly isLost = computed(() => this._status() === 'lost');

  readonly gravityMs = computed(() => {
    const cfg = this._config();
    return cfg ? gravityForLevel(cfg, this._level()) : 1000;
  });

  readonly elapsedMs = computed(() => {
    const start = this._startedAt();
    const end = this._finishedAt();
    if (!start) return 0;
    return (end ?? performance.now()) - start;
  });

  readonly linesIntoLevel = computed(() => {
    const cfg = this._config();
    if (!cfg) return 0;
    return this._lines() % cfg.linesPerLevel;
  });

  init(config: BlocksConfig): void {
    this._config.set(config);
    this._grid.set(emptyGrid(config.rows + config.hiddenRows, config.cols));
    this._activePiece.set(null);
    this._hold.set(null);
    this._holdLocked.set(false);
    this._nextQueue.set([]);
    this._status.set('playing');
    this._score.set(0);
    this._lines.set(0);
    this._level.set(1);
    this._combo.set(-1);
    this._lastClear.set({ id: 0, lines: 0, isTetris: false, combo: 0, cells: [] });
    this._startedAt.set(performance.now());
    this._finishedAt.set(null);
  }

  setGrid(grid: Grid): void {
    this._grid.set(grid);
  }

  setActivePiece(piece: Piece | null): void {
    this._activePiece.set(piece);
  }

  setNextQueue(queue: readonly TetrominoType[]): void {
    this._nextQueue.set(queue);
  }

  setHold(type: TetrominoType | null, locked: boolean): void {
    this._hold.set(type);
    this._holdLocked.set(locked);
  }

  setHoldLocked(locked: boolean): void {
    this._holdLocked.set(locked);
  }

  addScore(points: number): void {
    if (points <= 0) return;
    this._score.update(s => s + points);
  }

  addLines(n: number): void {
    if (n <= 0) return;
    const cfg = this._config();
    if (!cfg) return;
    const before = this._lines();
    const after = before + n;
    this._lines.set(after);
    const newLevel = 1 + Math.floor(after / cfg.linesPerLevel);
    if (newLevel !== this._level()) this._level.set(newLevel);
  }

  setCombo(combo: number): void {
    this._combo.set(combo);
  }

  flagClear(lines: number, combo: number, cells: readonly ClearedCell[]): void {
    this._lastClear.update(prev => ({
      id: prev.id + 1,
      lines,
      isTetris: lines === 4,
      combo,
      cells
    }));
  }

  triggerShake(): void {
    this._shakeId.update(n => n + 1);
  }

  setStatus(status: GameStatus): void {
    if (status === 'lost') {
      this._finishedAt.set(performance.now());
      this._maybePersistBest();
    }
    this._status.set(status);
  }

  private _maybePersistBest(): void {
    const score = this._score();
    if (score > this._bestScore()) {
      this._bestScore.set(score);
      try { localStorage.setItem(BEST_KEY, String(score)); } catch {}
    }
  }
}

function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}
