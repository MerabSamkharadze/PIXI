import { LayoutMode, getLayoutMode } from '../../../../../core/responsive/breakpoint';

export interface BreakoutConfig {
  readonly fieldWidth: number;
  readonly fieldHeight: number;
  readonly fieldPadding: number;
  readonly brickCols: number;
  readonly brickRows: number;
  readonly brickAreaTop: number;
  readonly brickGap: number;
  readonly brickHeight: number;
  readonly paddleWidth: number;
  readonly paddleHeight: number;
  readonly paddleY: number;
  readonly paddleSpeedPxPerMs: number;
  readonly ballRadius: number;
  readonly ballSpeedInitial: number;
  readonly ballSpeedMax: number;
  readonly ballSpeedRamp: number;
  readonly ballSpeedRampPerBricks: number;
  readonly powerUpFallSpeed: number;
  readonly powerUpDropChance: number;
  readonly powerUpDurationMs: number;
  readonly bulletSpeed: number;
  readonly laserCooldownMs: number;
  readonly initialLives: number;
  readonly maxAngleDeg: number;
}

export const DESKTOP_CONFIG: BreakoutConfig = {
  fieldWidth: 480,
  fieldHeight: 640,
  fieldPadding: 14,
  brickCols: 12,
  brickRows: 16,
  brickAreaTop: 60,
  brickGap: 2,
  brickHeight: 18,
  paddleWidth: 84,
  paddleHeight: 14,
  paddleY: 36,
  paddleSpeedPxPerMs: 0.55,
  ballRadius: 6,
  ballSpeedInitial: 0.34,
  ballSpeedMax: 0.55,
  ballSpeedRamp: 0.05,
  ballSpeedRampPerBricks: 15,
  powerUpFallSpeed: 0.13,
  powerUpDropChance: 0.08,
  powerUpDurationMs: 15000,
  bulletSpeed: 0.65,
  laserCooldownMs: 220,
  initialLives: 3,
  maxAngleDeg: 60
};

export const MOBILE_CONFIG: BreakoutConfig = {
  fieldWidth: 320,
  fieldHeight: 540,
  fieldPadding: 10,
  brickCols: 12,
  brickRows: 16,
  brickAreaTop: 48,
  brickGap: 2,
  brickHeight: 14,
  paddleWidth: 60,
  paddleHeight: 11,
  paddleY: 28,
  paddleSpeedPxPerMs: 0.48,
  ballRadius: 5,
  ballSpeedInitial: 0.27,
  ballSpeedMax: 0.45,
  ballSpeedRamp: 0.05,
  ballSpeedRampPerBricks: 15,
  powerUpFallSpeed: 0.11,
  powerUpDropChance: 0.08,
  powerUpDurationMs: 15000,
  bulletSpeed: 0.55,
  laserCooldownMs: 240,
  initialLives: 3,
  maxAngleDeg: 60
};

export function pickBreakoutConfig(viewportWidth: number): BreakoutConfig {
  return configFor(getLayoutMode(viewportWidth));
}

export function configFor(mode: LayoutMode): BreakoutConfig {
  return mode === 'mobile' ? MOBILE_CONFIG : DESKTOP_CONFIG;
}

export function brickWidth(config: BreakoutConfig): number {
  const inner = config.fieldWidth - config.fieldPadding * 2;
  return (inner - config.brickGap * (config.brickCols - 1)) / config.brickCols;
}

export function brickRect(config: BreakoutConfig, col: number, row: number): {
  x: number; y: number; w: number; h: number;
} {
  const w = brickWidth(config);
  const h = config.brickHeight;
  return {
    x: config.fieldPadding + col * (w + config.brickGap),
    y: config.brickAreaTop + row * (h + config.brickGap),
    w,
    h
  };
}
