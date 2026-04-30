import { Injectable, inject } from '@angular/core';
import { GameStateService } from '../state/game-state.service';
import { LabConfig } from '../models/lab-config.model';
import {
  Ball,
  Element,
  PortalElement
} from '../models/element.model';
import { LEVELS } from '../levels/level-data';
import {
  applyGravityWell,
  ballBumperCollide,
  ballGoalCollide,
  ballPegCollide,
  ballPortalCollide,
  ballSpinnerCollide,
  ballWallCollide
} from './physics';
import { clampSpeed, integrate, neededSubsteps, pushTrail } from './integrator';

@Injectable()
export class GameEngineService {
  private readonly state = inject(GameStateService);

  private nextBallId = 1;
  private trailEvery = 0;

  start(config: LabConfig): void {
    this.nextBallId = 1;
    this.loadLevel(0, config);
  }

  loadLevel(index: number, configOverride?: LabConfig): void {
    const config = configOverride ?? this.state.config();
    if (!config) return;
    const level = LEVELS[index];
    if (!level) return;
    this.state.initLevel(config, index, level);
  }

  setAim(x: number, y: number): void {
    this.state.setAim({ x, y });
  }

  launch(): void {
    if (!this.state.isPlaying()) return;
    if (this.state.ballsRemaining() <= 0) return;
    const config = this.state.config();
    if (!config) return;
    const spawner = this.state.spawner();
    const aim = this.state.aim();
    let dx = aim.x - spawner.x;
    let dy = aim.y - spawner.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) {
      dx = 0;
      dy = 1;
    } else {
      dx /= len;
      dy /= len;
    }
    if (dy < 0.05) dy = 0.05;
    const ball: Ball = {
      id: this.nextBallId++,
      pos: { x: spawner.x, y: spawner.y },
      vel: { x: dx * config.launchSpeed, y: dy * config.launchSpeed },
      trail: [],
      portalCooldown: 0,
      ageMs: 0,
      fadeOutMs: 0
    };
    this.state.setBalls([...this.state.balls(), ball]);
    this.state.incBallsLaunched();
    this.state.flagEvent({ kind: 'launch', x: spawner.x, y: spawner.y });
  }

  togglePause(): void {
    if (this.state.isPlaying()) this.state.setStatus('paused');
    else if (this.state.isPaused()) this.state.setStatus('playing');
  }

  retry(): void {
    const config = this.state.config();
    if (!config) return;
    this.loadLevel(this.state.levelIndex(), config);
  }

  next(): void {
    const config = this.state.config();
    if (!config) return;
    const idx = this.state.levelIndex() + 1;
    if (idx >= LEVELS.length) {
      this.state.setStatus('won');
      return;
    }
    this.loadLevel(idx, config);
  }

  tick(deltaMs: number): void {
    if (!this.state.isPlaying()) return;
    const config = this.state.config();
    if (!config) return;

    this.advanceSpinners(deltaMs);

    const elements = this.state.elements();
    const portalsById = new Map<number, PortalElement>();
    for (const el of elements) {
      if (el.type === 'portal') portalsById.set(el.id, el);
    }

    const balls = this.state.balls().map(b => cloneBall(b));
    const survivors: Ball[] = [];
    let goalsHit = 0;
    const spinnerAngles = this.state.spinnerAngles();

    for (const ball of balls) {
      const removed = this.stepBall(ball, deltaMs, config, elements, portalsById, spinnerAngles);
      if (removed === 'goal') {
        goalsHit++;
        continue;
      }
      if (removed === 'gone') continue;
      survivors.push(ball);
    }

    if (goalsHit > 0) {
      for (let i = 0; i < goalsHit; i++) this.state.incGoalProgress();
    }

    this.state.setBalls(survivors);

    this.trailEvery += deltaMs;
    if (this.trailEvery >= 32) {
      this.trailEvery = 0;
      const trailedBalls = survivors.map(b => {
        pushTrail(b, config.trailLength);
        return b;
      });
      this.state.setBalls(trailedBalls);
    }

    this.evaluateWinFail();
  }

  // ----------------------------------------------------------------------

  private stepBall(
    ball: Ball,
    deltaMs: number,
    config: LabConfig,
    elements: readonly Element[],
    portals: Map<number, PortalElement>,
    spinnerAngles: Record<number, number>
  ): 'goal' | 'gone' | null {
    ball.ageMs += deltaMs;
    if (ball.portalCooldown > 0) ball.portalCooldown = Math.max(0, ball.portalCooldown - deltaMs);

    if (ball.fadeOutMs > 0) {
      ball.fadeOutMs += deltaMs;
      if (ball.fadeOutMs >= config.fadeOutMs) return 'gone';
      return null;
    }

    // Apply gravity wells (force fields) before integration
    for (const el of elements) {
      if (el.type === 'gravityWell') applyGravityWell(ball, el, config.ballMass, deltaMs);
    }

    const subs = Math.min(8, neededSubsteps(ball, deltaMs, config.substepMaxPx));
    const subDt = deltaMs / subs;

    for (let s = 0; s < subs; s++) {
      integrate(ball, config.gravity, config.damping, subDt);
      clampSpeed(ball, config.maxBallSpeed);

      // walls / arena boundaries
      if (ball.pos.x < config.fieldPadding + config.ballRadius) {
        ball.pos.x = config.fieldPadding + config.ballRadius;
        if (ball.vel.x < 0) ball.vel.x = -ball.vel.x * 0.85;
      } else if (ball.pos.x > config.fieldWidth - config.fieldPadding - config.ballRadius) {
        ball.pos.x = config.fieldWidth - config.fieldPadding - config.ballRadius;
        if (ball.vel.x > 0) ball.vel.x = -ball.vel.x * 0.85;
      }
      if (ball.pos.y < config.fieldPadding + config.ballRadius) {
        ball.pos.y = config.fieldPadding + config.ballRadius;
        if (ball.vel.y < 0) ball.vel.y = -ball.vel.y * 0.85;
      }

      // Element collisions (each subset)
      for (const el of elements) {
        switch (el.type) {
          case 'peg': {
            if (ballPegCollide(ball, el, config.ballRadius, 0.88)) {
              this.state.flagEvent({ kind: 'peg', x: el.x, y: el.y, color: 0x94a3b8 });
            }
            break;
          }
          case 'bumper': {
            if (ballBumperCollide(ball, el, config.ballRadius, config.bumperBoost, config.bumperCapSpeed)) {
              this.state.flagEvent({ kind: 'bumper', x: el.x, y: el.y, color: 0x22d3ee });
            }
            break;
          }
          case 'wall': {
            if (ballWallCollide(ball, el, config.ballRadius, 0.85)) {
              this.state.flagEvent({ kind: 'wall', x: ball.pos.x, y: ball.pos.y, color: 0x4a6cf7 });
            }
            break;
          }
          case 'spinner': {
            const ang = spinnerAngles[el.id] ?? 0;
            if (ballSpinnerCollide(ball, el, ang, config.ballRadius, 0.85)) {
              this.state.flagEvent({ kind: 'spinner', x: ball.pos.x, y: ball.pos.y, color: 0xa855f7 });
            }
            break;
          }
          case 'portal': {
            const partner = portals.get(el.pairId);
            if (partner && ballPortalCollide(ball, el, partner, config.portalCooldownMs)) {
              this.state.flagEvent({ kind: 'portal', x: partner.x, y: partner.y, color: el.color });
            }
            break;
          }
          case 'goal': {
            if (ballGoalCollide(ball, el, config.ballRadius)) {
              this.state.flagEvent({ kind: 'goal', x: el.x, y: el.y, color: 0xa3e635, text: 'GOAL!' });
              return 'goal';
            }
            break;
          }
          case 'gravityWell':
            break;
        }
      }
    }

    // Check fall-off
    if (ball.pos.y > config.fieldHeight + 24) return 'gone';

    // Check settle (low velocity for too long)
    if (Math.hypot(ball.vel.x, ball.vel.y) < config.settleSpeed && ball.ageMs > config.settleMaxMs) {
      ball.fadeOutMs = 1;
    }

    return null;
  }

  private advanceSpinners(deltaMs: number): void {
    const elements = this.state.elements();
    const prev = this.state.spinnerAngles();
    let mutated = false;
    const next: Record<number, number> = { ...prev };
    for (const el of elements) {
      if (el.type !== 'spinner') continue;
      const angle = (next[el.id] ?? 0) + el.angularVel * deltaMs;
      next[el.id] = angle;
      mutated = true;
    }
    if (mutated) this.state.setSpinnerAngles(next);
  }

  private evaluateWinFail(): void {
    if (this.state.goalProgress() >= this.state.goalTotal()) {
      this.state.recordStars(this.state.levelIndex(), this.state.stars());
      this.state.setStatus('levelComplete');
      this.state.flagEvent({ kind: 'levelComplete' });
      return;
    }
    if (this.state.ballsRemaining() <= 0 && this.state.balls().length === 0) {
      this.state.setStatus('levelFailed');
      this.state.flagEvent({ kind: 'levelFailed' });
    }
  }
}

function cloneBall(b: Ball): Ball {
  return {
    id: b.id,
    pos: { x: b.pos.x, y: b.pos.y },
    vel: { x: b.vel.x, y: b.vel.y },
    trail: b.trail.slice(),
    portalCooldown: b.portalCooldown,
    ageMs: b.ageMs,
    fadeOutMs: b.fadeOutMs
  };
}
