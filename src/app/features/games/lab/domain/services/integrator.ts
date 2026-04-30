import { Ball } from '../models/element.model';

export function integrate(ball: Ball, gravity: number, damping: number, dtMs: number): void {
  ball.vel.y += gravity * dtMs;
  const damp = Math.pow(damping, dtMs);
  ball.vel.x *= damp;
  ball.vel.y *= damp;
  ball.pos.x += ball.vel.x * dtMs;
  ball.pos.y += ball.vel.y * dtMs;
}

export function clampSpeed(ball: Ball, maxSpeed: number): void {
  const sp = Math.hypot(ball.vel.x, ball.vel.y);
  if (sp > maxSpeed) {
    const k = maxSpeed / sp;
    ball.vel.x *= k;
    ball.vel.y *= k;
  }
}

export function neededSubsteps(ball: Ball, dtMs: number, substepMaxPx: number): number {
  const speed = Math.hypot(ball.vel.x, ball.vel.y);
  return Math.max(1, Math.ceil((speed * dtMs) / substepMaxPx));
}

export function pushTrail(ball: Ball, capacity: number): void {
  ball.trail.push({ x: ball.pos.x, y: ball.pos.y });
  while (ball.trail.length > capacity) ball.trail.shift();
}
