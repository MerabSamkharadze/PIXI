import { LayoutMode, getLayoutMode } from '../../../../../core/responsive/breakpoint';

export interface LabConfig {
  readonly fieldWidth: number;
  readonly fieldHeight: number;
  readonly fieldPadding: number;
  readonly ballRadius: number;
  readonly ballMass: number;
  readonly gravity: number;          // px/ms²
  readonly damping: number;          // multiplier per ms
  readonly launchSpeed: number;      // px/ms initial
  readonly minAimLen: number;
  readonly maxAimLen: number;
  readonly substepMaxPx: number;
  readonly portalCooldownMs: number;
  readonly trailLength: number;
  readonly bumperBoost: number;
  readonly bumperCapSpeed: number;
  readonly maxBallSpeed: number;
  readonly fadeOutMs: number;
  readonly settleSpeed: number;      // velocity below which ball begins fade-out
  readonly settleMaxMs: number;      // ms a slow ball can linger before forced removal
}

export const DESKTOP_CONFIG: LabConfig = {
  fieldWidth: 480,
  fieldHeight: 640,
  fieldPadding: 14,
  ballRadius: 8,
  ballMass: 1,
  gravity: 0.0009,
  damping: 0.9988,
  launchSpeed: 0.18,
  minAimLen: 24,
  maxAimLen: 110,
  substepMaxPx: 4,
  portalCooldownMs: 220,
  trailLength: 8,
  bumperBoost: 1.5,
  bumperCapSpeed: 0.85,
  maxBallSpeed: 1.0,
  fadeOutMs: 240,
  settleSpeed: 0.04,
  settleMaxMs: 1500
};

export const MOBILE_CONFIG: LabConfig = {
  fieldWidth: 320,
  fieldHeight: 540,
  fieldPadding: 10,
  ballRadius: 6,
  ballMass: 1,
  gravity: 0.0008,
  damping: 0.9988,
  launchSpeed: 0.15,
  minAimLen: 20,
  maxAimLen: 90,
  substepMaxPx: 3,
  portalCooldownMs: 240,
  trailLength: 6,
  bumperBoost: 1.5,
  bumperCapSpeed: 0.7,
  maxBallSpeed: 0.85,
  fadeOutMs: 240,
  settleSpeed: 0.035,
  settleMaxMs: 1500
};

export function pickLabConfig(viewportWidth: number): LabConfig {
  return configFor(getLayoutMode(viewportWidth));
}

export function configFor(mode: LayoutMode): LabConfig {
  return mode === 'mobile' ? MOBILE_CONFIG : DESKTOP_CONFIG;
}
