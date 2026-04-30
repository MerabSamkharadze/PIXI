import { Injectable, computed, signal } from '@angular/core';
import { Ball, Element, Vec2 } from '../models/element.model';
import { LabConfig } from '../models/lab-config.model';
import { LEVELS, } from '../levels/level-data';
import { LevelDef } from '../models/level.model';

const BEST_KEY = 'pixi.lab.bestStars';

export type LabStatus =
  | 'idle' | 'playing' | 'paused' | 'levelComplete' | 'levelFailed' | 'won';

export interface LabEvent {
  readonly id: number;
  readonly kind: 'peg' | 'bumper' | 'wall' | 'goal' | 'portal' | 'spinner' | 'launch' | 'levelComplete' | 'levelFailed' | 'won';
  readonly x?: number;
  readonly y?: number;
  readonly color?: number;
  readonly text?: string;
}

@Injectable()
export class GameStateService {
  private readonly _config = signal<LabConfig | null>(null);
  private readonly _balls = signal<readonly Ball[]>([]);
  private readonly _elements = signal<readonly Element[]>([]);
  private readonly _aim = signal<Vec2>({ x: 0, y: 0 });
  private readonly _spawner = signal<Vec2>({ x: 0, y: 0 });
  private readonly _status = signal<LabStatus>('idle');
  private readonly _levelIndex = signal(0);
  private readonly _ballsLaunched = signal(0);
  private readonly _maxBalls = signal(0);
  private readonly _goalProgress = signal(0);
  private readonly _goalTotal = signal(0);
  private readonly _spinnerAngles = signal<Record<number, number>>({});
  private readonly _lastEvent = signal<LabEvent>({ id: 0, kind: 'launch' });
  private readonly _bestStars = signal<Record<number, number>>(loadBest());
  private readonly _startedAt = signal<number | null>(null);
  private readonly _finishedAt = signal<number | null>(null);

  readonly config = this._config.asReadonly();
  readonly balls = this._balls.asReadonly();
  readonly elements = this._elements.asReadonly();
  readonly aim = this._aim.asReadonly();
  readonly spawner = this._spawner.asReadonly();
  readonly status = this._status.asReadonly();
  readonly levelIndex = this._levelIndex.asReadonly();
  readonly ballsLaunched = this._ballsLaunched.asReadonly();
  readonly maxBalls = this._maxBalls.asReadonly();
  readonly goalProgress = this._goalProgress.asReadonly();
  readonly goalTotal = this._goalTotal.asReadonly();
  readonly spinnerAngles = this._spinnerAngles.asReadonly();
  readonly lastEvent = this._lastEvent.asReadonly();
  readonly bestStars = this._bestStars.asReadonly();

  readonly isPlaying = computed(() => this._status() === 'playing');
  readonly isPaused = computed(() => this._status() === 'paused');
  readonly isLevelComplete = computed(() => this._status() === 'levelComplete');
  readonly isLevelFailed = computed(() => this._status() === 'levelFailed');
  readonly isWon = computed(() => this._status() === 'won');

  readonly currentLevel = computed<LevelDef | null>(() => LEVELS[this._levelIndex()] ?? null);

  readonly ballsRemaining = computed(() => Math.max(0, this._maxBalls() - this._ballsLaunched()));

  readonly stars = computed(() => {
    const used = this._ballsLaunched();
    const goal = this._goalTotal();
    if (goal <= 0) return 0;
    if (used <= goal) return 3;
    if (used <= goal + 1) return 2;
    return 1;
  });

  readonly currentBest = computed(() => this._bestStars()[this._levelIndex()] ?? 0);

  readonly elapsedMs = computed(() => {
    const s = this._startedAt();
    const e = this._finishedAt();
    if (!s) return 0;
    return (e ?? performance.now()) - s;
  });

  initLevel(config: LabConfig, levelIndex: number, level: LevelDef): void {
    this._config.set(config);
    this._levelIndex.set(levelIndex);
    this._elements.set(level.elements);
    this._spawner.set(level.spawner);
    this._aim.set({ x: level.spawner.x, y: level.spawner.y + 100 });
    this._balls.set([]);
    this._ballsLaunched.set(0);
    this._maxBalls.set(level.maxBalls);
    this._goalProgress.set(0);
    this._goalTotal.set(level.goalCount);
    this._status.set('playing');
    this._startedAt.set(performance.now());
    this._finishedAt.set(null);
    const sp: Record<number, number> = {};
    for (const el of level.elements) {
      if (el.type === 'spinner') sp[el.id] = 0;
    }
    this._spinnerAngles.set(sp);
  }

  setBalls(balls: readonly Ball[]): void { this._balls.set(balls); }
  setAim(v: Vec2): void { this._aim.set(v); }
  setStatus(status: LabStatus): void {
    if (status === 'levelComplete' || status === 'levelFailed' || status === 'won') {
      this._finishedAt.set(performance.now());
    }
    this._status.set(status);
  }
  incBallsLaunched(): void { this._ballsLaunched.update(n => n + 1); }
  incGoalProgress(): void { this._goalProgress.update(n => n + 1); }
  setSpinnerAngles(map: Record<number, number>): void { this._spinnerAngles.set(map); }
  flagEvent(event: Omit<LabEvent, 'id'>): void {
    this._lastEvent.update(prev => ({ id: prev.id + 1, ...event }));
  }

  recordStars(levelIndex: number, stars: number): void {
    const prev = this._bestStars()[levelIndex] ?? 0;
    if (stars <= prev) return;
    this._bestStars.update(map => ({ ...map, [levelIndex]: stars }));
    try { localStorage.setItem(BEST_KEY, JSON.stringify(this._bestStars())); } catch {}
  }
}

function loadBest(): Record<number, number> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || !parsed) return {};
    return parsed as Record<number, number>;
  } catch {
    return {};
  }
}
