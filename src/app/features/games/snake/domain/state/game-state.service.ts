import { Injectable, computed, signal } from '@angular/core';
import { Cell, Direction, Food, GameStatus } from '../models/snake.model';
import { SnakeConfig } from '../models/snake-config.model';

const BEST_SCORE_KEY = 'pixi.snake.bestScore';

@Injectable()
export class GameStateService {
  private readonly _config = signal<SnakeConfig | null>(null);
  private readonly _snake = signal<readonly Cell[]>([]);
  private readonly _prevSnake = signal<readonly Cell[]>([]);
  private readonly _direction = signal<Direction>('right');
  private readonly _queuedDirection = signal<Direction | null>(null);
  private readonly _food = signal<Food | null>(null);
  private readonly _status = signal<GameStatus>('idle');
  private readonly _score = signal(0);
  private readonly _tickMs = signal(160);
  private readonly _bestScore = signal(loadBest());
  private readonly _startedAt = signal<number | null>(null);
  private readonly _finishedAt = signal<number | null>(null);
  private readonly _lastEatTickIndex = signal(0);
  private readonly _tickIndex = signal(0);
  private readonly _lastEatenFood = signal<Food | null>(null);

  readonly config = this._config.asReadonly();
  readonly snake = this._snake.asReadonly();
  readonly prevSnake = this._prevSnake.asReadonly();
  readonly direction = this._direction.asReadonly();
  readonly queuedDirection = this._queuedDirection.asReadonly();
  readonly food = this._food.asReadonly();
  readonly status = this._status.asReadonly();
  readonly score = this._score.asReadonly();
  readonly tickMs = this._tickMs.asReadonly();
  readonly bestScore = this._bestScore.asReadonly();
  readonly startedAt = this._startedAt.asReadonly();
  readonly finishedAt = this._finishedAt.asReadonly();
  readonly tickIndex = this._tickIndex.asReadonly();
  readonly lastEatenFood = this._lastEatenFood.asReadonly();

  readonly length = computed(() => this._snake().length);
  readonly speedLevel = computed(() => {
    const cfg = this._config();
    if (!cfg) return 1;
    const range = cfg.initialTickMs - cfg.minTickMs;
    if (range <= 0) return 1;
    const used = cfg.initialTickMs - this._tickMs();
    return 1 + Math.round((used / range) * 9);
  });
  readonly elapsedMs = computed(() => {
    const start = this._startedAt();
    const end = this._finishedAt();
    if (!start) return 0;
    return (end ?? performance.now()) - start;
  });
  readonly isWon = computed(() => this._status() === 'won');
  readonly isLost = computed(() => this._status() === 'lost');
  readonly isPaused = computed(() => this._status() === 'paused');
  readonly isPlaying = computed(() => this._status() === 'playing');

  init(config: SnakeConfig, snake: readonly Cell[], food: Food, direction: Direction): void {
    this._config.set(config);
    this._snake.set(snake);
    this._prevSnake.set(snake);
    this._direction.set(direction);
    this._queuedDirection.set(null);
    this._food.set(food);
    this._status.set('playing');
    this._score.set(0);
    this._tickMs.set(config.initialTickMs);
    this._startedAt.set(performance.now());
    this._finishedAt.set(null);
    this._lastEatTickIndex.set(0);
    this._tickIndex.set(0);
    this._lastEatenFood.set(null);
  }

  recordEat(food: Food): void {
    this._lastEatenFood.set(food);
  }

  setSnake(prev: readonly Cell[], next: readonly Cell[]): void {
    this._prevSnake.set(prev);
    this._snake.set(next);
    this._tickIndex.update(i => i + 1);
  }

  setDirection(dir: Direction): void {
    this._direction.set(dir);
    this._queuedDirection.set(null);
  }

  queueDirection(dir: Direction): void {
    this._queuedDirection.set(dir);
  }

  setFood(food: Food): void {
    this._food.set(food);
  }

  addScore(points: number): void {
    this._score.update(s => s + points);
    this._lastEatTickIndex.set(this._tickIndex());
  }

  bumpSpeed(): void {
    const cfg = this._config();
    if (!cfg) return;
    this._tickMs.update(t => Math.max(cfg.minTickMs, t * cfg.speedDecay));
  }

  setStatus(status: GameStatus): void {
    if (status === 'lost' || status === 'won') {
      this._finishedAt.set(performance.now());
      this._maybePersistBest();
    }
    this._status.set(status);
  }

  private _maybePersistBest(): void {
    const score = this._score();
    if (score > this._bestScore()) {
      this._bestScore.set(score);
      try {
        localStorage.setItem(BEST_SCORE_KEY, String(score));
      } catch {
        // localStorage may be unavailable; ignore.
      }
    }
  }
}

function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}
