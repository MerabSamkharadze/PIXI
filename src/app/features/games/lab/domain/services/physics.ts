import {
  Ball,
  BumperElement,
  GoalElement,
  GravityWellElement,
  PegElement,
  PortalElement,
  SpinnerElement,
  WallElement
} from '../models/element.model';

export interface CollisionEvent {
  readonly kind: 'peg' | 'bumper' | 'wall' | 'goal' | 'portal' | 'spinner';
  readonly x: number;
  readonly y: number;
  readonly elementId?: number;
  readonly partnerId?: number;
}

/**
 * Resolve ball-circle collision (used for pegs, bumpers, goals).
 * Returns true if the ball was overlapping the circle.
 */
function resolveBallCircle(
  ball: Ball,
  cx: number,
  cy: number,
  cr: number,
  ballR: number,
  restitution: number
): boolean {
  const dx = ball.pos.x - cx;
  const dy = ball.pos.y - cy;
  const dist2 = dx * dx + dy * dy;
  const minDist = cr + ballR;
  if (dist2 >= minDist * minDist) return false;
  const dist = Math.sqrt(dist2) || 0.0001;
  const nx = dx / dist;
  const ny = dy / dist;
  // separate
  ball.pos.x = cx + nx * minDist;
  ball.pos.y = cy + ny * minDist;
  // reflect along normal
  const vn = ball.vel.x * nx + ball.vel.y * ny;
  if (vn < 0) {
    ball.vel.x -= (1 + restitution) * vn * nx;
    ball.vel.y -= (1 + restitution) * vn * ny;
  }
  return true;
}

export function ballPegCollide(ball: Ball, peg: PegElement, ballR: number, restitution: number): boolean {
  return resolveBallCircle(ball, peg.x, peg.y, peg.r, ballR, restitution);
}

export function ballBumperCollide(
  ball: Ball,
  bumper: BumperElement,
  ballR: number,
  boost: number,
  capSpeed: number
): boolean {
  const dx = ball.pos.x - bumper.x;
  const dy = ball.pos.y - bumper.y;
  const dist2 = dx * dx + dy * dy;
  const minDist = bumper.r + ballR;
  if (dist2 >= minDist * minDist) return false;
  const dist = Math.sqrt(dist2) || 0.0001;
  const nx = dx / dist;
  const ny = dy / dist;
  ball.pos.x = bumper.x + nx * minDist;
  ball.pos.y = bumper.y + ny * minDist;
  const vn = ball.vel.x * nx + ball.vel.y * ny;
  // reflect with elastic restitution
  ball.vel.x -= 2 * vn * nx;
  ball.vel.y -= 2 * vn * ny;
  // boost
  ball.vel.x *= boost;
  ball.vel.y *= boost;
  // cap
  const sp = Math.hypot(ball.vel.x, ball.vel.y);
  if (sp > capSpeed) {
    const k = capSpeed / sp;
    ball.vel.x *= k;
    ball.vel.y *= k;
  }
  return true;
}

export function ballGoalCollide(ball: Ball, goal: GoalElement, ballR: number): boolean {
  const dx = ball.pos.x - goal.x;
  const dy = ball.pos.y - goal.y;
  const reach = goal.r * 0.85;
  return dx * dx + dy * dy <= (reach + ballR * 0.4) * (reach + ballR * 0.4);
}

export function ballPortalCollide(
  ball: Ball,
  portal: PortalElement,
  partner: PortalElement,
  cooldownMs: number
): boolean {
  if (ball.portalCooldown > 0) return false;
  const dx = ball.pos.x - portal.x;
  const dy = ball.pos.y - portal.y;
  if (dx * dx + dy * dy > portal.r * portal.r) return false;
  // teleport
  const angleDelta = partner.angle - portal.angle;
  const cos = Math.cos(angleDelta);
  const sin = Math.sin(angleDelta);
  const newVx = ball.vel.x * cos - ball.vel.y * sin;
  const newVy = ball.vel.x * sin + ball.vel.y * cos;
  ball.vel.x = newVx;
  ball.vel.y = newVy;
  ball.pos.x = partner.x + newVx * 0.2;
  ball.pos.y = partner.y + newVy * 0.2;
  ball.portalCooldown = cooldownMs;
  return true;
}

export function ballWallCollide(
  ball: Ball,
  wall: WallElement,
  ballR: number,
  restitution: number
): boolean {
  // Transform ball into wall-local space
  const cos = Math.cos(-wall.angle);
  const sin = Math.sin(-wall.angle);
  const lx = (ball.pos.x - wall.cx) * cos - (ball.pos.y - wall.cy) * sin;
  const ly = (ball.pos.x - wall.cx) * sin + (ball.pos.y - wall.cy) * cos;
  const halfW = wall.w / 2;
  const halfH = wall.h / 2;
  const cx = Math.max(-halfW, Math.min(halfW, lx));
  const cy = Math.max(-halfH, Math.min(halfH, ly));
  const dx = lx - cx;
  const dy = ly - cy;
  const dist2 = dx * dx + dy * dy;
  if (dist2 >= ballR * ballR) return false;
  const dist = Math.sqrt(dist2);
  let lnx: number;
  let lny: number;
  if (dist > 0.0001) {
    lnx = dx / dist;
    lny = dy / dist;
  } else {
    // Ball center is inside the rect; pick the nearest face normal
    const dl = halfW + lx;
    const dr = halfW - lx;
    const dt = halfH + ly;
    const db = halfH - ly;
    const m = Math.min(dl, dr, dt, db);
    if (m === dl) { lnx = -1; lny = 0; }
    else if (m === dr) { lnx = 1; lny = 0; }
    else if (m === dt) { lnx = 0; lny = -1; }
    else { lnx = 0; lny = 1; }
  }
  // Rotate normal back to world space
  const cw = Math.cos(wall.angle);
  const sw = Math.sin(wall.angle);
  const nx = lnx * cw - lny * sw;
  const ny = lnx * sw + lny * cw;
  // separate
  const overlap = ballR - dist;
  ball.pos.x += nx * overlap;
  ball.pos.y += ny * overlap;
  const vn = ball.vel.x * nx + ball.vel.y * ny;
  if (vn < 0) {
    ball.vel.x -= (1 + restitution) * vn * nx;
    ball.vel.y -= (1 + restitution) * vn * ny;
  }
  return true;
}

export function ballSpinnerCollide(
  ball: Ball,
  spinner: SpinnerElement,
  spinnerAngle: number,
  ballR: number,
  restitution: number
): boolean {
  const wall: WallElement = {
    type: 'wall',
    id: spinner.id,
    cx: spinner.cx,
    cy: spinner.cy,
    w: spinner.w,
    h: spinner.h,
    angle: spinnerAngle
  };
  if (!ballWallCollide(ball, wall, ballR, restitution)) return false;
  // Add tangential velocity from spin: v_tangent = ω × r
  const rx = ball.pos.x - spinner.cx;
  const ry = ball.pos.y - spinner.cy;
  // Tangential = (-ry, rx) * ω
  const tangentSpeed = spinner.angularVel * 320; // px/ms scale factor
  ball.vel.x += -ry * 0 + tangentSpeed * (-ry / Math.max(0.001, Math.hypot(rx, ry))) * 0.4;
  ball.vel.y += rx * 0 + tangentSpeed * (rx / Math.max(0.001, Math.hypot(rx, ry))) * 0.4;
  return true;
}

export function applyGravityWell(
  ball: Ball,
  well: GravityWellElement,
  ballMass: number,
  dtMs: number
): void {
  const dx = well.x - ball.pos.x;
  const dy = well.y - ball.pos.y;
  const dist2 = dx * dx + dy * dy;
  if (dist2 > well.r * well.r) return;
  const dist = Math.sqrt(dist2) || 0.0001;
  const minR = 18;
  const r2 = Math.max(dist2, minR * minR);
  const force = well.strength * ballMass / r2;
  const sign = well.mode === 'attract' ? 1 : -1;
  const ax = (dx / dist) * force * sign;
  const ay = (dy / dist) * force * sign;
  ball.vel.x += ax * dtMs;
  ball.vel.y += ay * dtMs;
}
