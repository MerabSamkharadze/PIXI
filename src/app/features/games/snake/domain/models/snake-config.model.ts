import { LayoutMode, getLayoutMode } from '../../../../../core/responsive/breakpoint';

export interface SnakeConfig {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;
  readonly boardPadding: number;
  readonly initialTickMs: number;
  readonly minTickMs: number;
  readonly speedDecay: number;
  readonly initialLength: number;
  readonly targetLength: number;
  readonly foodEmojis: readonly { emoji: string; hue: number }[];
}

const FOOD_EMOJIS = [
  { emoji: '🍎', hue: 0 },
  { emoji: '🍒', hue: 340 },
  { emoji: '🍇', hue: 280 },
  { emoji: '🍌', hue: 50 },
  { emoji: '🥕', hue: 25 }
] as const;

export const DESKTOP_CONFIG: SnakeConfig = {
  cols: 24,
  rows: 16,
  cellSize: 28,
  boardPadding: 16,
  initialTickMs: 160,
  minTickMs: 70,
  speedDecay: 0.95,
  initialLength: 4,
  targetLength: 30,
  foodEmojis: FOOD_EMOJIS
};

export const MOBILE_CONFIG: SnakeConfig = {
  cols: 12,
  rows: 16,
  cellSize: 24,
  boardPadding: 10,
  initialTickMs: 170,
  minTickMs: 80,
  speedDecay: 0.95,
  initialLength: 4,
  targetLength: 20,
  foodEmojis: FOOD_EMOJIS
};

export function pickSnakeConfig(viewportWidth: number): SnakeConfig {
  return configFor(getLayoutMode(viewportWidth));
}

export function configFor(mode: LayoutMode): SnakeConfig {
  return mode === 'mobile' ? MOBILE_CONFIG : DESKTOP_CONFIG;
}

export function boardPixelSize(config: SnakeConfig): { width: number; height: number } {
  return {
    width: config.cols * config.cellSize + config.boardPadding * 2,
    height: config.rows * config.cellSize + config.boardPadding * 2
  };
}
