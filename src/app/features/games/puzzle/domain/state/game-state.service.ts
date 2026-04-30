import { Injectable, computed, signal } from '@angular/core';
import { GamePhase, Grid, Tile } from '../models/tile.model';
import { PuzzleConfig } from '../models/puzzle-config.model';

const BEST_MOVES_KEY = 'pixi.puzzle.bestMoves';
const BEST_TIME_KEY = 'pixi.puzzle.bestTimeMs';

@Injectable()
export class GameStateService {
  private readonly _config = signal<PuzzleConfig | null>(null);
  private readonly _grid = signal<Grid>([]);
  private readonly _emptyIndex = signal(0);
  private readonly _phase = signal<GamePhase>('idle');
  private readonly _moves = signal(0);
  private readonly _startedAt = signal<number | null>(null);
  private readonly _finishedAt = signal<number | null>(null);
  private readonly _bestMoves = signal<number | null>(loadBestMoves());
  private readonly _bestTimeMs = signal<number | null>(loadBestTime());

  readonly config = this._config.asReadonly();
  readonly grid = this._grid.asReadonly();
  readonly emptyIndex = this._emptyIndex.asReadonly();
  readonly phase = this._phase.asReadonly();
  readonly moves = this._moves.asReadonly();
  readonly startedAt = this._startedAt.asReadonly();
  readonly finishedAt = this._finishedAt.asReadonly();
  readonly bestMoves = this._bestMoves.asReadonly();
  readonly bestTimeMs = this._bestTimeMs.asReadonly();

  readonly isPlaying = computed(() => this._phase() === 'playing');
  readonly isWon = computed(() => this._phase() === 'won');

  readonly elapsedMs = computed(() => {
    const start = this._startedAt();
    const end = this._finishedAt();
    return start && end ? end - start : 0;
  });

  readonly correctCount = computed(() => {
    const grid = this._grid();
    let n = 0;
    for (let i = 0; i < grid.length; i++) {
      const t = grid[i];
      if (t && t.goalIndex === i) n++;
    }
    return n;
  });

  readonly totalTiles = computed(() => {
    const cfg = this._config();
    return cfg ? cfg.rows * cfg.cols - 1 : 0;
  });

  readonly goalTiles = computed<readonly Tile[]>(() => {
    const cfg = this._config();
    if (!cfg) return [];
    const total = cfg.rows * cfg.cols - 1;
    const out: Tile[] = [];
    for (let i = 0; i < total; i++) {
      out.push({ id: i + 1, emoji: cfg.assetKeys[i], goalIndex: i });
    }
    return out;
  });

  init(config: PuzzleConfig, grid: Grid, emptyIndex: number): void {
    this._config.set(config);
    this._grid.set(grid);
    this._emptyIndex.set(emptyIndex);
    this._phase.set('playing');
    this._moves.set(0);
    this._startedAt.set(performance.now());
    this._finishedAt.set(null);
  }

  applyMove(tilePosition: number, emptyPosition: number): void {
    this._grid.update(g => {
      const next = g.slice();
      [next[tilePosition], next[emptyPosition]] = [next[emptyPosition], next[tilePosition]];
      return next;
    });
    this._emptyIndex.set(tilePosition);
    this._moves.update(n => n + 1);
  }

  markWon(): void {
    this._finishedAt.set(performance.now());
    this._phase.set('won');
    this._maybePersistBest();
  }

  private _maybePersistBest(): void {
    const moves = this._moves();
    const time = this.elapsedMs();
    const prevMoves = this._bestMoves();
    const prevTime = this._bestTimeMs();

    if (prevMoves === null || moves < prevMoves) {
      this._bestMoves.set(moves);
      try { localStorage.setItem(BEST_MOVES_KEY, String(moves)); } catch {}
    }
    if (prevTime === null || time < prevTime) {
      this._bestTimeMs.set(time);
      try { localStorage.setItem(BEST_TIME_KEY, String(time)); } catch {}
    }
  }
}

function loadBestMoves(): number | null {
  try {
    const raw = localStorage.getItem(BEST_MOVES_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function loadBestTime(): number | null {
  try {
    const raw = localStorage.getItem(BEST_TIME_KEY);
    if (!raw) return null;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
