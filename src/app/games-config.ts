import { GameRegistration } from './core/game/game.types';

/**
 * The single source of truth for the platform.
 * Adding a new game = add one entry here + a folder under features/games/<id>/.
 * Routes & Hub catalog are generated from this list.
 */
export const GAMES: readonly GameRegistration[] = [
  {
    manifest: {
      id: 'memory',
      title: 'Memory',
      description: 'Flip cards and match all the pairs.',
      thumbnail: '🧠',
      tags: ['classic', 'casual'],
      accent: '#4a6cf7'
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  },
  {
    manifest: {
      id: 'puzzle',
      title: 'Puzzle',
      description: 'Slide tiles into the correct order.',
      thumbnail: '🧩',
      tags: ['logic', 'classic'],
      accent: '#7b4af7',
      disabled: true
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  },
  {
    manifest: {
      id: 'snake',
      title: 'Snake',
      description: 'Eat, grow, don’t bite yourself.',
      thumbnail: '🐍',
      tags: ['arcade', 'reflex'],
      accent: '#49e0a0',
      disabled: true
    },
    loadShell: () =>
      import('./features/games/memory/memory.shell').then(m => m.MemoryShell)
  }
];
