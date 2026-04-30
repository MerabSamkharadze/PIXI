export interface LevelDef {
  readonly id: number;
  readonly name: string;
  readonly layout: readonly string[];
  readonly speedMul: number;
}

/**
 * Layout chars: '.' empty, 'S' standard, 'T' tough, 'X' steel, 'P' power-brick.
 * Max 16 rows × 12 cols. Rows are placed starting at config.brickAreaTop.
 */
export const LEVELS: readonly LevelDef[] = [
  {
    id: 1,
    name: 'Classic Wall',
    speedMul: 1.0,
    layout: [
      '.SSSSSSSSSS.',
      '.TTTTTTTTTT.',
      '.SSSSSSSSSS.',
      '.SSSSSSSSSS.',
      '.PSSSSSSSSP.'
    ]
  },
  {
    id: 2,
    name: 'Pyramid',
    speedMul: 1.08,
    layout: [
      '.....SS.....',
      '....TSST....',
      '...TSSSST...',
      '..TSSSSSST..',
      '.TSSSSSSSST.',
      'TSPSSSSSSSPT'
    ]
  },
  {
    id: 3,
    name: 'Tunnel',
    speedMul: 1.15,
    layout: [
      'SSSSSSSSSSSS',
      'S..........S',
      'S.TT....TT.S',
      'S.TTSPPSTT.S',
      'S.TT....TT.S',
      'S..........S',
      'SSSSSSSSSSSS'
    ]
  },
  {
    id: 4,
    name: 'Fortress',
    speedMul: 1.22,
    layout: [
      'TTTTTTTTTTTT',
      'T.SSSSSSSS.T',
      'T.S.PPPP.S.T',
      'T.SSSSSSSS.T',
      'TTTTTTTTTTTT'
    ]
  },
  {
    id: 5,
    name: 'Arrowhead',
    speedMul: 1.3,
    layout: [
      '.....SS.....',
      '....SSSS....',
      '...SXSSXS...',
      '..SXTTTTXS..',
      '.SXTSSSSTXS.',
      'SXTSPPPPSTXS'
    ]
  },
  {
    id: 6,
    name: 'Gauntlet',
    speedMul: 1.4,
    layout: [
      'SSSSSSSSSSSS',
      'TXTXTXTXTXTX',
      'SSSSSSSSSSSS',
      'XPXPXPXPXPXP',
      'SSSSSSSSSSSS',
      'TXTXTXTXTXTX'
    ]
  }
];
