import { LayoutMode, getLayoutMode } from '../../../../../core/responsive/breakpoint';

export interface BlocksConfig {
  readonly cols: number;
  readonly rows: number;
  readonly hiddenRows: number;
  readonly cellSize: number;
  readonly fieldPadding: number;
  readonly initialGravityMs: number;
  readonly minGravityMs: number;
  readonly gravityDecay: number;
  readonly softDropMs: number;
  readonly lockDelayMs: number;
  readonly lockResetCap: number;
  readonly linesPerLevel: number;
  readonly nextQueueSize: number;
}

export const DESKTOP_CONFIG: BlocksConfig = {
  cols: 10,
  rows: 20,
  hiddenRows: 2,
  cellSize: 32,
  fieldPadding: 12,
  initialGravityMs: 800,
  minGravityMs: 50,
  gravityDecay: 0.85,
  softDropMs: 50,
  lockDelayMs: 500,
  lockResetCap: 15,
  linesPerLevel: 10,
  nextQueueSize: 3
};

export const MOBILE_CONFIG: BlocksConfig = {
  cols: 10,
  rows: 20,
  hiddenRows: 2,
  cellSize: 22,
  fieldPadding: 8,
  initialGravityMs: 800,
  minGravityMs: 60,
  gravityDecay: 0.85,
  softDropMs: 60,
  lockDelayMs: 500,
  lockResetCap: 15,
  linesPerLevel: 10,
  nextQueueSize: 3
};

export function pickBlocksConfig(viewportWidth: number): BlocksConfig {
  return configFor(getLayoutMode(viewportWidth));
}

export function configFor(mode: LayoutMode): BlocksConfig {
  return mode === 'mobile' ? MOBILE_CONFIG : DESKTOP_CONFIG;
}

export function fieldPixelSize(config: BlocksConfig): { width: number; height: number } {
  return {
    width: config.cols * config.cellSize + config.fieldPadding * 2,
    height: config.rows * config.cellSize + config.fieldPadding * 2
  };
}

export function gravityForLevel(config: BlocksConfig, level: number): number {
  const ms = config.initialGravityMs * Math.pow(config.gravityDecay, level - 1);
  return Math.max(config.minGravityMs, ms);
}
