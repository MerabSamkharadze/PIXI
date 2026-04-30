export type ElementType =
  | 'peg'
  | 'wall'
  | 'bumper'
  | 'goal'
  | 'portal'
  | 'gravityWell'
  | 'spinner';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  readonly id: number;
  pos: Vec2;
  vel: Vec2;
  trail: Vec2[];
  portalCooldown: number;
  ageMs: number;
  fadeOutMs: number;
}

export interface PegElement {
  readonly type: 'peg';
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface BumperElement {
  readonly type: 'bumper';
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface WallElement {
  readonly type: 'wall';
  readonly id: number;
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
  readonly h: number;
  readonly angle: number;
}

export interface GoalElement {
  readonly type: 'goal';
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface PortalElement {
  readonly type: 'portal';
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly pairId: number;
  readonly angle: number;
  readonly color: number;
}

export interface GravityWellElement {
  readonly type: 'gravityWell';
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly strength: number;
  readonly mode: 'attract' | 'repel';
}

export interface SpinnerElement {
  readonly type: 'spinner';
  readonly id: number;
  readonly cx: number;
  readonly cy: number;
  readonly w: number;
  readonly h: number;
  readonly angularVel: number;
}

export type Element =
  | PegElement
  | BumperElement
  | WallElement
  | GoalElement
  | PortalElement
  | GravityWellElement
  | SpinnerElement;

export const ELEMENT_COLORS = {
  peg: 0x94a3b8,
  bumper: 0x22d3ee,
  wall: 0x4a6cf7,
  goal: 0xa3e635,
  portalBlue: 0x22d3ee,
  portalPink: 0xec4899,
  gravityAttract: 0x22d3ee,
  gravityRepel: 0xec4899,
  spinner: 0xa855f7
} as const;
