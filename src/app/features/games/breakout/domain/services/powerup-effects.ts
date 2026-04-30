import { Ball } from '../models/playfield.model';
import { POWERUP_TIMED, PowerUpType } from '../models/brick.model';
import { BreakoutConfig } from '../models/breakout-config.model';
import { GameStateService } from '../state/game-state.service';

let nextBallId = 1;

export function nextId(): number {
  return nextBallId++;
}

export function applyEffect(
  type: PowerUpType,
  state: GameStateService,
  config: BreakoutConfig,
  now: number
): void {
  switch (type) {
    case 'wide': {
      const paddle = state.paddle();
      state.setPaddle({ ...paddle, width: config.paddleWidth * 1.5 });
      state.setActivePowerUp('wide', now + config.powerUpDurationMs);
      break;
    }
    case 'slow': {
      const balls = state.balls();
      state.setBalls(balls.map(b => ({
        ...b,
        vel: { x: b.vel.x * 0.7, y: b.vel.y * 0.7 }
      })));
      state.setActivePowerUp('slow', now + config.powerUpDurationMs);
      break;
    }
    case 'multi': {
      const balls = state.balls();
      const source = balls.find(b => !b.attached) ?? balls[0];
      if (!source) break;
      const moving = Math.hypot(source.vel.x, source.vel.y);
      const speed = moving > 0.01 ? moving : config.ballSpeedInitial;
      const baseAngle = moving > 0.01 ? Math.atan2(source.vel.y, source.vel.x) : -Math.PI / 2;
      const offsets = [-Math.PI / 9, Math.PI / 9];
      const newBalls: Ball[] = offsets.map(off => ({
        id: nextId(),
        pos: { x: source.pos.x, y: source.pos.y },
        vel: {
          x: Math.cos(baseAngle + off) * speed,
          y: Math.sin(baseAngle + off) * speed
        },
        attached: false
      }));
      state.setBalls([...balls, ...newBalls]);
      state.flagEvent({ kind: 'multiBall', text: 'MULTIBALL' });
      break;
    }
    case 'laser': {
      state.setActivePowerUp('laser', now + config.powerUpDurationMs);
      break;
    }
    case 'life': {
      state.addLife();
      break;
    }
  }

  if (!POWERUP_TIMED[type]) {
    state.setActivePowerUp(type, null);
  }
}

export function expireEffect(
  type: PowerUpType,
  state: GameStateService,
  config: BreakoutConfig
): void {
  switch (type) {
    case 'wide': {
      const paddle = state.paddle();
      state.setPaddle({ ...paddle, width: config.paddleWidth });
      break;
    }
    case 'slow': {
      const balls = state.balls();
      state.setBalls(balls.map(b => ({
        ...b,
        vel: { x: b.vel.x / 0.7, y: b.vel.y / 0.7 }
      })));
      break;
    }
    case 'laser':
    case 'multi':
    case 'life':
      break;
  }
  state.setActivePowerUp(type, null);
}
