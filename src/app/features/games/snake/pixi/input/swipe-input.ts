import { Direction } from '../../domain/models/snake.model';

const MIN_SWIPE_PX = 22;

export class SwipeInput {
  private startX = 0;
  private startY = 0;
  private active = false;
  private readonly down: (e: PointerEvent) => void;
  private readonly up: (e: PointerEvent) => void;
  private readonly cancel: () => void;

  constructor(
    private readonly el: HTMLElement,
    onDirection: (d: Direction) => void
  ) {
    this.down = (e: PointerEvent) => {
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.active = true;
    };
    this.up = (e: PointerEvent) => {
      if (!this.active) return;
      this.active = false;
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      if (Math.abs(dx) < MIN_SWIPE_PX && Math.abs(dy) < MIN_SWIPE_PX) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        onDirection(dx > 0 ? 'right' : 'left');
      } else {
        onDirection(dy > 0 ? 'down' : 'up');
      }
    };
    this.cancel = () => { this.active = false; };

    el.addEventListener('pointerdown', this.down);
    el.addEventListener('pointerup', this.up);
    el.addEventListener('pointercancel', this.cancel);
    el.style.touchAction = 'none';
  }

  destroy(): void {
    this.el.removeEventListener('pointerdown', this.down);
    this.el.removeEventListener('pointerup', this.up);
    this.el.removeEventListener('pointercancel', this.cancel);
    this.el.style.touchAction = '';
  }
}
