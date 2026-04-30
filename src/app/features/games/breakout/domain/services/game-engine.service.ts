import { Injectable, inject } from '@angular/core';
import { GameStateService } from '../state/game-state.service';
import {
  BreakoutConfig,
  brickRect
} from '../models/breakout-config.model';
import { Ball, Bullet, PowerUp } from '../models/playfield.model';
import {
  BRICK_HP,
  BRICK_SCORE,
  Brick,
  BrickType,
  POWERUP_TYPES,
  PowerUpType
} from '../models/brick.model';
import { LEVELS } from '../levels/level-data';
import {
  HitSide,
  ballPaddleHit,
  ballRectCollision,
  magnitude,
  reflect
} from './physics';
import { applyEffect, expireEffect, nextId } from './powerup-effects';

const COMBO_BONUS_PER = 10;
const POWERUP_CATCH_SCORE = 250;
const BULLET_KILL_SCORE = 50;

@Injectable()
export class GameEngineService {
  private readonly state = inject(GameStateService);

  private brickIdCounter = 1;
  private powerUpIdCounter = 1;
  private bulletIdCounter = 1;

  private keyboardDir: -1 | 0 | 1 = 0;

  start(config: BreakoutConfig): void {
    this.state.init(config);
    this.brickIdCounter = 1;
    this.powerUpIdCounter = 1;
    this.bulletIdCounter = 1;
    this.keyboardDir = 0;
    this.loadLevel(0);
    this.spawnAttachedBall();
  }

  tick(deltaMs: number): void {
    if (!this.state.isPlaying()) return;
    const config = this.state.config();
    if (!config) return;
    const now = performance.now();

    this.expireTimedPowerUps(now);
    this.movePaddleByKeyboard(deltaMs, config);
    this.tickPaddleCooldown(deltaMs);
    this.tickBalls(deltaMs, config);
    this.tickPowerUps(deltaMs, config);
    this.tickBullets(deltaMs, config);

    if (this.state.balls().length === 0) {
      this.loseLife();
    } else if (this.areAllBricksCleared()) {
      this.nextLevel();
    }
  }

  setPaddleX(x: number): void {
    if (!this.state.isPlaying()) return;
    const config = this.state.config();
    if (!config) return;
    const paddle = this.state.paddle();
    const half = paddle.width / 2;
    const clamped = Math.max(config.fieldPadding + half, Math.min(config.fieldWidth - config.fieldPadding - half, x));
    this.state.setPaddle({ ...paddle, x: clamped });
    this.followAttachedBalls(clamped);
  }

  setKeyboardDir(dir: -1 | 0 | 1): void {
    this.keyboardDir = dir;
  }

  launchBalls(): void {
    if (!this.state.isPlaying()) return;
    const config = this.state.config();
    if (!config) return;
    const balls = this.state.balls();
    let changed = false;
    const speed = this.currentBallSpeed(config);
    const next = balls.map(b => {
      if (!b.attached) return b;
      changed = true;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      return {
        ...b,
        attached: false,
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
      };
    });
    if (changed) this.state.setBalls(next);
  }

  fire(): void {
    if (!this.state.isPlaying()) return;
    if (!this.state.laserActive()) return;
    const paddle = this.state.paddle();
    if (paddle.laserCooldownMs > 0) return;
    const config = this.state.config();
    if (!config) return;

    const half = paddle.width / 2;
    const y = config.fieldHeight - config.paddleY - config.paddleHeight - 4;
    const left: Bullet = {
      id: this.bulletIdCounter++,
      pos: { x: paddle.x - half + 6, y },
      vel: { x: 0, y: -config.bulletSpeed }
    };
    const right: Bullet = {
      id: this.bulletIdCounter++,
      pos: { x: paddle.x + half - 6, y },
      vel: { x: 0, y: -config.bulletSpeed }
    };
    this.state.setBullets([...this.state.bullets(), left, right]);
    this.state.setPaddle({ ...paddle, laserCooldownMs: config.laserCooldownMs });
  }

  togglePause(): void {
    if (this.state.isPlaying()) this.state.setStatus('paused');
    else if (this.state.isPaused()) this.state.setStatus('playing');
  }

  resumeFromTransition(): void {
    if (this.state.isLevelTransition()) this.state.setStatus('playing');
  }

  // ----------------------------------------------------------------------

  private currentLevelSpeedMul(): number {
    const lvl = this.state.currentLevel();
    return lvl?.speedMul ?? 1.0;
  }

  private currentBallSpeed(config: BreakoutConfig): number {
    const destroyed = this.state.bricksDestroyed();
    const ramps = Math.floor(destroyed / config.ballSpeedRampPerBricks);
    const base = config.ballSpeedInitial * (1 + ramps * config.ballSpeedRamp) * this.currentLevelSpeedMul();
    return Math.min(base, config.ballSpeedMax);
  }

  private movePaddleByKeyboard(deltaMs: number, config: BreakoutConfig): void {
    if (this.keyboardDir === 0) return;
    const paddle = this.state.paddle();
    const next = paddle.x + this.keyboardDir * config.paddleSpeedPxPerMs * deltaMs;
    this.setPaddleX(next);
  }

  private tickPaddleCooldown(deltaMs: number): void {
    const paddle = this.state.paddle();
    if (paddle.laserCooldownMs <= 0) return;
    this.state.setPaddle({ ...paddle, laserCooldownMs: Math.max(0, paddle.laserCooldownMs - deltaMs) });
  }

  private followAttachedBalls(paddleX: number): void {
    const balls = this.state.balls();
    let changed = false;
    const next = balls.map(b => {
      if (!b.attached) return b;
      changed = true;
      return { ...b, pos: { x: paddleX, y: b.pos.y } };
    });
    if (changed) this.state.setBalls(next);
  }

  private tickBalls(deltaMs: number, config: BreakoutConfig): void {
    const balls = this.state.balls();
    if (balls.length === 0) return;

    const updated: Ball[] = [];
    let bricksMutated = false;
    let bricks = this.state.bricks().slice();

    for (const ball of balls) {
      if (ball.attached) {
        updated.push(ball);
        continue;
      }
      const speed = magnitude(ball.vel);
      const maxStep = Math.max(config.ballRadius * 0.8, 2);
      const steps = Math.max(1, Math.ceil((speed * deltaMs) / maxStep));
      const stepDt = deltaMs / steps;
      let pos = { ...ball.pos };
      let vel = { ...ball.vel };
      let alive = true;

      for (let s = 0; s < steps && alive; s++) {
        const prev = { ...pos };
        const next = { x: pos.x + vel.x * stepDt, y: pos.y + vel.y * stepDt };

        if (next.x < config.fieldPadding + config.ballRadius) {
          next.x = config.fieldPadding + config.ballRadius;
          vel = { x: -vel.x, y: vel.y };
        } else if (next.x > config.fieldWidth - config.fieldPadding - config.ballRadius) {
          next.x = config.fieldWidth - config.fieldPadding - config.ballRadius;
          vel = { x: -vel.x, y: vel.y };
        }
        if (next.y < config.fieldPadding + config.ballRadius) {
          next.y = config.fieldPadding + config.ballRadius;
          vel = { x: vel.x, y: -vel.y };
        }

        const paddle = this.state.paddle();
        const paddleY = config.fieldHeight - config.paddleY - config.paddleHeight;
        const phit = ballPaddleHit(prev, next, config.ballRadius, paddle, paddleY, config.paddleHeight, this.currentBallSpeed(config), config.maxAngleDeg);
        if (phit) {
          pos = phit.pos;
          vel = phit.vel;
          this.state.setCombo(0);
          continue;
        }

        let brickHit: { brick: Brick; side: HitSide; correctedPos: { x: number; y: number }; dist: number } | null = null;
        for (const brick of bricks) {
          const rect = brickRect(config, brick.col, brick.row);
          const hit = ballRectCollision(prev, next, config.ballRadius, rect);
          if (!hit) continue;
          const dx = hit.correctedPos.x - prev.x;
          const dy = hit.correctedPos.y - prev.y;
          const dist = dx * dx + dy * dy;
          if (!brickHit || dist < brickHit.dist) {
            brickHit = { brick, side: hit.side, correctedPos: hit.correctedPos, dist };
          }
        }

        if (brickHit) {
          pos = brickHit.correctedPos;
          vel = reflect(vel, brickHit.side);
          bricks = this.processBrickHit(bricks, brickHit.brick, config);
          bricksMutated = true;
          continue;
        }

        if (next.y > config.fieldHeight - config.fieldPadding) {
          alive = false;
          break;
        }
        pos = next;
      }

      if (alive) updated.push({ ...ball, pos, vel });
    }

    if (bricksMutated) this.state.setBricks(bricks);
    this.state.setBalls(updated);
  }

  private processBrickHit(bricks: Brick[], target: Brick, config: BreakoutConfig): Brick[] {
    if (target.type === 'steel') return bricks;

    const idx = bricks.findIndex(b => b.id === target.id);
    if (idx < 0) return bricks;
    const brick = bricks[idx];
    const rect = brickRect(config, brick.col, brick.row);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const color = brickColor(brick.type);

    if (brick.hp > 1) {
      const cracked: Brick = { ...brick, hp: brick.hp - 1 };
      const next = bricks.slice();
      next[idx] = cracked;
      this.state.flagEvent({ kind: 'brickCrack', x: cx, y: cy, color });
      return next;
    }

    const next = bricks.filter(b => b.id !== brick.id);
    const score = BRICK_SCORE[brick.type];
    const combo = this.state.combo() + 1;
    this.state.setCombo(combo);
    this.state.addScore(score + (combo > 1 ? combo * COMBO_BONUS_PER : 0));
    this.state.addBricksDestroyed();
    this.state.flagEvent({ kind: 'brickBreak', x: cx, y: cy, color, combo });

    if (brick.type === 'power' || (brick.type === 'standard' && Math.random() < config.powerUpDropChance)) {
      const type = brick.powerUp ?? this.rollPowerUp();
      const pu: PowerUp = {
        id: this.powerUpIdCounter++,
        type,
        pos: { x: cx, y: cy },
        vel: { x: 0, y: config.powerUpFallSpeed }
      };
      this.state.setPowerUps([...this.state.powerUps(), pu]);
    }

    return next;
  }

  private tickPowerUps(deltaMs: number, config: BreakoutConfig): void {
    const items = this.state.powerUps();
    if (items.length === 0) return;
    const paddle = this.state.paddle();
    const paddleY = config.fieldHeight - config.paddleY - config.paddleHeight;
    const half = paddle.width / 2;
    const remaining: PowerUp[] = [];

    for (const pu of items) {
      const ny = pu.pos.y + pu.vel.y * deltaMs;
      const nx = pu.pos.x;
      if (
        ny + 8 >= paddleY &&
        ny <= paddleY + config.paddleHeight &&
        nx >= paddle.x - half - 8 &&
        nx <= paddle.x + half + 8
      ) {
        applyEffect(pu.type, this.state, config, performance.now());
        this.state.addScore(POWERUP_CATCH_SCORE);
        this.state.flagEvent({ kind: 'powerUpCaught', x: nx, y: paddleY, powerUp: pu.type, text: powerUpName(pu.type) });
        continue;
      }
      if (ny > config.fieldHeight) continue;
      remaining.push({ ...pu, pos: { x: nx, y: ny } });
    }
    this.state.setPowerUps(remaining);
  }

  private tickBullets(deltaMs: number, config: BreakoutConfig): void {
    const bullets = this.state.bullets();
    if (bullets.length === 0) return;
    let bricks = this.state.bricks().slice();
    let mutated = false;
    const remaining: Bullet[] = [];

    for (const b of bullets) {
      const ny = b.pos.y + b.vel.y * deltaMs;
      if (ny < config.fieldPadding) continue;

      let hit = false;
      for (const brick of bricks) {
        const rect = brickRect(config, brick.col, brick.row);
        if (b.pos.x >= rect.x && b.pos.x <= rect.x + rect.w && ny >= rect.y && ny <= rect.y + rect.h) {
          if (brick.type === 'steel') {
            hit = true;
            break;
          }
          bricks = bricks.filter(x => x.id !== brick.id);
          mutated = true;
          this.state.addScore(BULLET_KILL_SCORE);
          this.state.addBricksDestroyed();
          const color = brickColor(brick.type);
          this.state.flagEvent({ kind: 'brickBreak', x: rect.x + rect.w / 2, y: rect.y + rect.h / 2, color });
          hit = true;
          break;
        }
      }
      if (!hit) remaining.push({ ...b, pos: { x: b.pos.x, y: ny } });
    }

    if (mutated) this.state.setBricks(bricks);
    this.state.setBullets(remaining);
  }

  private expireTimedPowerUps(now: number): void {
    const config = this.state.config();
    if (!config) return;
    const active = this.state.activePowerUps();
    for (const key of Object.keys(active) as PowerUpType[]) {
      const expiry = active[key];
      if (expiry !== null && expiry > 0 && now >= expiry) {
        expireEffect(key, this.state, config);
      }
    }
  }

  private rollPowerUp(): PowerUpType {
    return POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  }

  private spawnAttachedBall(): void {
    const config = this.state.config();
    if (!config) return;
    const paddle = this.state.paddle();
    const paddleY = config.fieldHeight - config.paddleY - config.paddleHeight;
    const ball: Ball = {
      id: nextId(),
      pos: { x: paddle.x, y: paddleY - config.ballRadius - 2 },
      vel: { x: 0, y: 0 },
      attached: true
    };
    this.state.setBalls([...this.state.balls(), ball]);
  }

  private loseLife(): void {
    this.state.loseLife();
    this.state.setCombo(0);
    this.state.triggerShake();
    this.state.flagEvent({ kind: 'lifeLost' });
    if (this.state.lives() <= 0) {
      this.state.setStatus('lost');
      return;
    }
    const config = this.state.config();
    if (!config) return;
    const active = this.state.activePowerUps();
    for (const key of Object.keys(active) as PowerUpType[]) {
      if (active[key] !== null) expireEffect(key, this.state, config);
    }
    this.state.setBullets([]);
    this.state.setPowerUps([]);
    this.state.setBalls([]);
    this.spawnAttachedBall();
  }

  private nextLevel(): void {
    const idx = this.state.levelIndex() + 1;
    this.state.flagEvent({ kind: 'levelComplete', text: idx >= LEVELS.length ? 'CLEARED!' : `LEVEL ${idx + 1}` });
    if (idx >= LEVELS.length) {
      this.state.setStatus('won');
      return;
    }
    this.state.setLevelIndex(idx);
    this.loadLevel(idx);
    this.state.setBalls([]);
    this.state.setPowerUps([]);
    this.state.setBullets([]);
    this.spawnAttachedBall();
  }

  private loadLevel(index: number): void {
    const def = LEVELS[index];
    if (!def) return;
    const config = this.state.config();
    if (!config) return;

    const bricks: Brick[] = [];
    for (let row = 0; row < def.layout.length; row++) {
      const line = def.layout[row];
      for (let col = 0; col < line.length && col < config.brickCols; col++) {
        const ch = line[col];
        const type = charToBrickType(ch);
        if (!type) continue;
        const id = this.brickIdCounter++;
        const brick: Brick = {
          id,
          type,
          col,
          row,
          hp: BRICK_HP[type],
          powerUp: type === 'power' ? this.rollPowerUp() : undefined
        };
        bricks.push(brick);
      }
    }
    this.state.setBricks(bricks);
  }

  private areAllBricksCleared(): boolean {
    return !this.state.bricks().some(b => b.type !== 'steel');
  }
}

function charToBrickType(ch: string): BrickType | null {
  switch (ch) {
    case 'S': return 'standard';
    case 'T': return 'tough';
    case 'X': return 'steel';
    case 'P': return 'power';
    default: return null;
  }
}

function brickColor(type: BrickType): number {
  switch (type) {
    case 'standard': return 0xf59e0b;
    case 'tough': return 0xa855f7;
    case 'steel': return 0x64748b;
    case 'power': return 0x22d3ee;
  }
}

function powerUpName(type: PowerUpType): string {
  switch (type) {
    case 'wide': return 'WIDE';
    case 'slow': return 'SLOW';
    case 'multi': return 'MULTIBALL';
    case 'laser': return 'LASER';
    case 'life': return '+1 LIFE';
  }
}
