import { LayoutMode, getLayoutMode } from '../../../../../core/responsive/breakpoint';

export interface PuzzleConfig {
  readonly rows: number;
  readonly cols: number;
  readonly tileSize: number;
  readonly gap: number;
  readonly boardPadding: number;
  readonly slideMs: number;
  readonly shuffleMoves: number;
  readonly assetKeys: readonly string[];
}

const ASSET_KEYS = [
  '🍕', '🍔', '🍟', '🍣', '🍩', '🍦', '🍓', '🍇',
  '🍎', '🍊', '🍌', '🥑', '🌮', '🍪', '🥐'
] as const;

export const DESKTOP_CONFIG: PuzzleConfig = {
  rows: 4,
  cols: 4,
  tileSize: 120,
  gap: 10,
  boardPadding: 14,
  slideMs: 160,
  shuffleMoves: 80,
  assetKeys: ASSET_KEYS
};

export const MOBILE_CONFIG: PuzzleConfig = {
  rows: 4,
  cols: 4,
  tileSize: 70,
  gap: 6,
  boardPadding: 10,
  slideMs: 140,
  shuffleMoves: 80,
  assetKeys: ASSET_KEYS
};

export function pickPuzzleConfig(viewportWidth: number): PuzzleConfig {
  return configFor(getLayoutMode(viewportWidth));
}

export function configFor(mode: LayoutMode): PuzzleConfig {
  return mode === 'mobile' ? MOBILE_CONFIG : DESKTOP_CONFIG;
}

export function boardPixelSize(config: PuzzleConfig): { width: number; height: number } {
  const inner = {
    width: config.cols * config.tileSize + (config.cols - 1) * config.gap,
    height: config.rows * config.tileSize + (config.rows - 1) * config.gap
  };
  return {
    width: inner.width + config.boardPadding * 2,
    height: inner.height + config.boardPadding * 2
  };
}
