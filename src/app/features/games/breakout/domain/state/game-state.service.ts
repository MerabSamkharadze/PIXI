import { Injectable, computed, signal } from '@angular/core';
import { Ball, Bullet, GameStatus, Paddle, PowerUp } from '../models/playfield.model';
import { Brick, BrickType, PowerUpType } from '../models/brick.model';
import { BreakoutConfig } from '../models/breakout-config.model';
import { LEVELS, LevelDef } from '../levels/level-data';

const BEST_KEY = 'pixi.breakout.bestScore';

export interface BreakEvent {
  readonly id: number;
  readonly kind: 'brickBreak' | 'brickCrack' | 'powerUpCaught' | 'lifeLost' | 'levelComplete' | 'multiBall';
  readonly x?: number;
  readonly y?: number;
  readonly color?: number;
  readonly powerUp?: PowerUpType;
  readonly text?: string;
  readonly combo?: number;
}

export type ActivePowerUps = Readonly<Record<PowerUpType, number | null>>;

const EMPTY_POWERS: ActivePowerUps = {
  wide: null, slow: null, multi: null, laser: null, life: null
};

@Injectable()
export class GameStateService {
  private readonly _config = signal<BreakoutConfig | null>(null);
  private readonly _balls = signal<readonly Ball[]>([]);
  private readonly _paddle = signal<Paddle>({ x: 0, width: 0, laserCooldownMs: 0 });
  private readonly _bricks = signal<readonly Brick[]>([]);
  private readonly _powerUps = signal<readonly PowerUp[]>([]);
  private readonly _bullets = signal<readonly Bullet[]>([]);
  private readonly _status = signal<GameStatus>('idle');
  private readonly _score = signal(0);
  private readonly _lives = signal(0);
  private readonly _levelIndex = signal(0);
  private readonly _bricksDestroyed = signal(0);
  private readonly _combo = signal(0);
  private readonly _activePowerUps = signal<ActivePowerUps>(EMPTY_POWERS);
  private readonly _lastEvent = signal<BreakEvent>({ id: 0, kind: 'brickBreak' });
  private readonly _bestScore = signal<number>(loadBest());
  private readonly _startedAt = signal<number | null>(null);
  private readonly _finishedAt = signal<number | null>(null);
  private readonly _shakeId = signal(0);

  readonly config = this._config.asReadonly();
  readonly balls = this._balls.asReadonly();
  readonly paddle = this._paddle.asReadonly();
  readonly bricks = this._bricks.asReadonly();
  readonly powerUps = this._powerUps.asReadonly();
  readonly bullets = this._bullets.asReadonly();
  readonly status = this._status.asReadonly();
  readonly score = this._score.asReadonly();
  readonly lives = this._lives.asReadonly();
  readonly levelIndex = this._levelIndex.asReadonly();
  readonly bricksDestroyed = this._bricksDestroyed.asReadonly();
  readonly combo = this._combo.asReadonly();
  readonly activePowerUps = this._activePowerUps.asReadonly();
  readonly lastEvent = this._lastEvent.asReadonly();
  readonly bestScore = this._bestScore.asReadonly();
  readonly startedAt = this._startedAt.asReadonly();
  readonly finishedAt = this._finishedAt.asReadonly();
  readonly shakeId = this._shakeId.asReadonly();

  readonly isPlaying = computed(() => this._status() === 'playing');
  readonly isPaused = computed(() => this._status() === 'paused');
  readonly isLost = computed(() => this._status() === 'lost');
  readonly isWon = computed(() => this._status() === 'won');
  readonly isLevelTransition = computed(() => this._status() === 'levelTransition');

  readonly currentLevel = computed<LevelDef | null>(() => {
    const idx = this._levelIndex();
    return LEVELS[idx] ?? null;
  });

  readonly elapsedMs = computed(() => {
    const start = this._startedAt();
    const end = this._finishedAt();
    if (!start) return 0;
    return (end ?? performance.now()) - start;
  });

  readonly wideActive = computed(() => this._activePowerUps().wide !== null);
  readonly slowActive = computed(() => this._activePowerUps().slow !== null);
  readonly laserActive = computed(() => this._activePowerUps().laser !== null);

  init(config: BreakoutConfig): void {
    this._config.set(config);
    this._paddle.set({
      x: config.fieldWidth / 2,
      width: config.paddleWidth,
      laserCooldownMs: 0
    });
    this._balls.set([]);
    this._bricks.set([]);
    this._powerUps.set([]);
    this._bullets.set([]);
    this._status.set('playing');
    this._score.set(0);
    this._lives.set(config.initialLives);
    this._levelIndex.set(0);
    this._bricksDestroyed.set(0);
    this._combo.set(0);
    this._activePowerUps.set(EMPTY_POWERS);
    this._startedAt.set(performance.now());
    this._finishedAt.set(null);
  }

  setBalls(balls: readonly Ball[]): void { this._balls.set(balls); }
  setPaddle(paddle: Paddle): void { this._paddle.set(paddle); }
  setBricks(bricks: readonly Brick[]): void { this._bricks.set(bricks); }
  setPowerUps(items: readonly PowerUp[]): void { this._powerUps.set(items); }
  setBullets(items: readonly Bullet[]): void { this._bullets.set(items); }
  setLevelIndex(i: number): void { this._levelIndex.set(i); }
  setStatus(status: GameStatus): void {
    if (status === 'lost' || status === 'won') {
      this._finishedAt.set(performance.now());
      this._maybePersistBest();
    }
    this._status.set(status);
  }

  addScore(points: number): void {
    if (points <= 0) return;
    this._score.update(s => s + points);
  }

  addLife(): void {
    this._lives.update(n => n + 1);
  }

  loseLife(): void {
    this._lives.update(n => Math.max(0, n - 1));
  }

  addBricksDestroyed(n = 1): void {
    this._bricksDestroyed.update(v => v + n);
  }

  setCombo(n: number): void {
    this._combo.set(n);
  }

  setActivePowerUp(type: PowerUpType, expiryMs: number | null): void {
    this._activePowerUps.update(prev => ({ ...prev, [type]: expiryMs }));
  }

  flagEvent(event: Omit<BreakEvent, 'id'>): void {
    this._lastEvent.update(prev => ({ id: prev.id + 1, ...event }));
  }

  triggerShake(): void {
    this._shakeId.update(n => n + 1);
  }

  private _maybePersistBest(): void {
    const score = this._score();
    if (score > this._bestScore()) {
      this._bestScore.set(score);
      try { localStorage.setItem(BEST_KEY, String(score)); } catch {}
    }
  }
}

export type BrickRefType = BrickType;

function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}
