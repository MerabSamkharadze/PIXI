import { PowerUpType } from './brick.model';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  readonly id: number;
  pos: Vec2;
  vel: Vec2;
  attached: boolean;
}

export interface Paddle {
  x: number;
  width: number;
  laserCooldownMs: number;
}

export interface PowerUp {
  readonly id: number;
  readonly type: PowerUpType;
  pos: Vec2;
  vel: Vec2;
}

export interface Bullet {
  readonly id: number;
  pos: Vec2;
  vel: Vec2;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'lost' | 'won' | 'levelTransition';
