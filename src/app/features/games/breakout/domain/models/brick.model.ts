export type BrickType = 'standard' | 'tough' | 'steel' | 'power';
export type PowerUpType = 'wide' | 'slow' | 'multi' | 'laser' | 'life';

export interface Brick {
  readonly id: number;
  readonly type: BrickType;
  readonly col: number;
  readonly row: number;
  readonly powerUp?: PowerUpType;
  hp: number;
}

export const BRICK_COLORS: Record<BrickType, number> = {
  standard: 0xf59e0b,
  tough:    0xa855f7,
  steel:    0x64748b,
  power:    0x22d3ee
};

export const BRICK_HP: Record<BrickType, number> = {
  standard: 1,
  tough: 2,
  steel: Infinity,
  power: 1
};

export const BRICK_SCORE: Record<BrickType, number> = {
  standard: 100,
  tough: 200,
  steel: 0,
  power: 100
};

export const POWERUP_COLORS: Record<PowerUpType, number> = {
  wide:  0x22d3ee,
  slow:  0xa3e635,
  multi: 0xf59e0b,
  laser: 0xef4444,
  life:  0xec4899
};

export const POWERUP_LABELS: Record<PowerUpType, string> = {
  wide: 'W',
  slow: 'S',
  multi: 'M',
  laser: 'L',
  life: '+'
};

export const POWERUP_NAMES: Record<PowerUpType, string> = {
  wide: 'WIDE',
  slow: 'SLOW',
  multi: 'MULTIBALL',
  laser: 'LASER',
  life: '+1 LIFE'
};

export const POWERUP_TIMED: Record<PowerUpType, boolean> = {
  wide: true,
  slow: true,
  multi: false,
  laser: true,
  life: false
};

export const POWERUP_TYPES: readonly PowerUpType[] = ['wide', 'slow', 'multi', 'laser', 'life'];
