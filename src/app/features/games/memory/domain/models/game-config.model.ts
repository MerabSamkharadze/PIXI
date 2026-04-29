export interface GameConfig {
  readonly rows: number;
  readonly cols: number;
  readonly cardSize: number;
  readonly gap: number;
  readonly boardPadding: number;
  readonly previewMs: number;
  readonly assetKeys: readonly string[];
}

export const DEFAULT_CONFIG: GameConfig = {
  rows: 4,
  cols: 4,
  cardSize: 140,
  gap: 16,
  boardPadding: 12,
  previewMs: 900,
  assetKeys: ['🍕', '🍔', '🍟', '🍣', '🍩', '🍦', '🍓', '🍇']
};

export type GamePhase = 'idle' | 'playing' | 'locked' | 'won';
