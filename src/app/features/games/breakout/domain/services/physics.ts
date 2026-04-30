import { Ball, Paddle, Vec2 } from '../models/playfield.model';

export type HitSide = 'top' | 'bottom' | 'left' | 'right';

export interface RectHit {
  readonly side: HitSide;
  readonly correctedPos: Vec2;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export function ballRectCollision(
  prev: Vec2,
  next: Vec2,
  radius: number,
  rect: Rect
): RectHit | null {
  const minX = rect.x - radius;
  const minY = rect.y - radius;
  const maxX = rect.x + rect.w + radius;
  const maxY = rect.y + rect.h + radius;

  if (next.x < minX || next.x > maxX || next.y < minY || next.y > maxY) return null;

  const wasOutsideX = prev.x < rect.x - radius || prev.x > rect.x + rect.w + radius;
  const wasOutsideY = prev.y < rect.y - radius || prev.y > rect.y + rect.h + radius;

  if (wasOutsideY && !wasOutsideX) {
    if (prev.y < rect.y) {
      return { side: 'top', correctedPos: { x: next.x, y: rect.y - radius } };
    }
    return { side: 'bottom', correctedPos: { x: next.x, y: rect.y + rect.h + radius } };
  }
  if (wasOutsideX && !wasOutsideY) {
    if (prev.x < rect.x) {
      return { side: 'left', correctedPos: { x: rect.x - radius, y: next.y } };
    }
    return { side: 'right', correctedPos: { x: rect.x + rect.w + radius, y: next.y } };
  }
  if (wasOutsideX && wasOutsideY) {
    const dx = prev.x < rect.x ? rect.x - prev.x : prev.x - (rect.x + rect.w);
    const dy = prev.y < rect.y ? rect.y - prev.y : prev.y - (rect.y + rect.h);
    if (dy >= dx) {
      if (prev.y < rect.y) return { side: 'top', correctedPos: { x: next.x, y: rect.y - radius } };
      return { side: 'bottom', correctedPos: { x: next.x, y: rect.y + rect.h + radius } };
    } else {
      if (prev.x < rect.x) return { side: 'left', correctedPos: { x: rect.x - radius, y: next.y } };
      return { side: 'right', correctedPos: { x: rect.x + rect.w + radius, y: next.y } };
    }
  }

  return null;
}

export function reflect(vel: Vec2, side: HitSide): Vec2 {
  switch (side) {
    case 'top':
    case 'bottom':
      return { x: vel.x, y: -vel.y };
    case 'left':
    case 'right':
      return { x: -vel.x, y: vel.y };
  }
}

export function ballPaddleHit(
  prev: Vec2,
  next: Vec2,
  radius: number,
  paddle: Paddle,
  paddleY: number,
  paddleH: number,
  speed: number,
  maxAngleDeg: number
): { vel: Vec2; pos: Vec2 } | null {
  const half = paddle.width / 2;
  const rect: Rect = {
    x: paddle.x - half,
    y: paddleY,
    w: paddle.width,
    h: paddleH
  };
  const hit = ballRectCollision(prev, next, radius, rect);
  if (!hit) return null;
  // Paddle is one-sided: only top hits reflect. Side or bottom hits let the ball pass
  // through (it will eventually fall below the playfield and trigger a life loss).
  if (hit.side !== 'top') return null;

  const offset = (hit.correctedPos.x - paddle.x) / half;
  const clamped = Math.max(-1, Math.min(1, offset));
  const maxAngle = (maxAngleDeg * Math.PI) / 180;
  const angle = -Math.PI / 2 + clamped * maxAngle;
  return {
    vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
    pos: hit.correctedPos
  };
}

export function magnitude(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function scaleTo(v: Vec2, target: number): Vec2 {
  const m = magnitude(v);
  if (m === 0) return { x: 0, y: -target };
  const k = target / m;
  return { x: v.x * k, y: v.y * k };
}
