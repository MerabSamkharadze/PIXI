import { Direction } from '../../domain/models/snake.model';

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right'
};

export class KeyboardInput {
  private readonly handler: (e: KeyboardEvent) => void;

  constructor(
    onDirection: (d: Direction) => void,
    onPause: () => void
  ) {
    this.handler = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.code];
      if (dir) {
        e.preventDefault();
        onDirection(dir);
        return;
      }
      if (e.code === 'Space' || e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        onPause();
      }
    };
    window.addEventListener('keydown', this.handler);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handler);
  }
}
