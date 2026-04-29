import { GameRegistration } from './core/game/game.types';

/**
 * Single source of truth for the platform.
 * Adding a new game = add one entry here + create features/games/<id>/.
 * Hub catalog and routes are both generated from this list.
 */
export const GAMES: readonly GameRegistration[] = [
  {
    manifest: {
      id: 'memory',
      title: 'Memory',
      description: 'Flip cards and match all the pairs before time runs out.',
      thumbnail: '🧠',
      tags: ['classic', 'casual'],
      accent: '#a855f7' /* neon violet */
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  },
  {
    manifest: {
      id: 'puzzle',
      title: 'Puzzle',
      description: 'Slide tiles into the correct order against a stopwatch.',
      thumbnail: '🧩',
      tags: ['logic', 'classic'],
      accent: '#22d3ee' /* neon cyan */,
      disabled: true
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  },
  {
    manifest: {
      id: 'snake',
      title: 'Snake',
      description: 'Eat, grow, don’t bite yourself. Reflex-driven arcade.',
      thumbnail: '🐍',
      tags: ['arcade', 'reflex'],
      accent: '#a3e635' /* acid green */,
      disabled: true
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  },
  {
    manifest: {
      id: 'tetris',
      title: 'Blocks',
      description: 'Stack falling blocks, clear lines, chase the high score.',
      thumbnail: '🟦',
      tags: ['arcade', 'puzzle'],
      accent: '#ec4899' /* neon pink */,
      disabled: true
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  },
  {
    manifest: {
      id: 'breakout',
      title: 'Breakout',
      description: 'Bounce the ball, smash the bricks, catch the power-ups.',
      thumbnail: '🧱',
      tags: ['arcade', 'classic'],
      accent: '#f59e0b' /* neon amber */,
      disabled: true
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  },
  {
    manifest: {
      id: 'lab',
      title: 'The Lab',
      description: 'A sandbox for new ideas — particles, shaders, experiments.',
      thumbnail: '⚗️',
      tags: ['experimental'],
      accent: '#22d3ee',
      disabled: true
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  }
];
