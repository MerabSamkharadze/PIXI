export interface GameConfig {
  readonly rows: number;
  readonly cols: number;
  readonly cardSize: number;
  readonly gap: number;
  readonly previewMs: number;
  readonly assetKeys: readonly string[];
}

export const DEFAULT_CONFIG: GameConfig = {
  rows: 4,
  cols: 4,
  cardSize: 140,
  gap: 16,
  previewMs: 900,
  assetKeys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
};

export type GamePhase = 'idle' | 'playing' | 'locked' | 'won';
