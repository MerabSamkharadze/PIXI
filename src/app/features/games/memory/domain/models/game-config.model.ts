import { LayoutMode, getLayoutMode } from '../../../../../core/responsive/breakpoint';

export interface GameConfig {
  readonly rows: number;
  readonly cols: number;
  readonly cardSize: number;
  readonly gap: number;
  readonly boardPadding: number;
  readonly previewMs: number;
  readonly assetKeys: readonly string[];
}

const ASSET_KEYS = ['🍕', '🍔', '🍟', '🍣', '🍩', '🍦', '🍓', '🍇'] as const;

export const DESKTOP_CONFIG: GameConfig = {
  rows: 4,
  cols: 4,
  cardSize: 140,
  gap: 16,
  boardPadding: 12,
  previewMs: 900,
  assetKeys: ASSET_KEYS
};

export const MOBILE_CONFIG: GameConfig = {
  rows: 4,
  cols: 4,
  cardSize: 72,
  gap: 8,
  boardPadding: 8,
  previewMs: 900,
  assetKeys: ASSET_KEYS
};

export function pickMemoryConfig(viewportWidth: number): GameConfig {
  return configFor(getLayoutMode(viewportWidth));
}

export function configFor(mode: LayoutMode): GameConfig {
  return mode === 'mobile' ? MOBILE_CONFIG : DESKTOP_CONFIG;
}

export type GamePhase = 'idle' | 'playing' | 'locked' | 'won';
