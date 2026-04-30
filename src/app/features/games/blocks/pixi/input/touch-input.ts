import { RotDirection } from '../../domain/models/tetromino.model';

export interface TouchActions {
  readonly onLeft: () => void;
  readonly onRight: () => void;
  readonly onSoftDrop: (active: boolean) => void;
  readonly onHardDrop: () => void;
  readonly onRotate: (direction: RotDirection) => void;
  readonly onHold: () => void;
}

const SWIPE_PX = 22;
const LONG_PRESS_MS = 400;
const SOFT_DROP_HOLD_PX = 60;

export class TouchInput {
  private readonly down: (e: PointerEvent) => void;
  private readonly move: (e: PointerEvent) => void;
  private readonly up: (e: PointerEvent) => void;
  private readonly cancel: () => void;

  private startX = 0;
  private startY = 0;
  private lastShiftedX = 0;
  private active = false;
  private moved = false;
  private softHeld = false;
  private longPressTimer: number | null = null;
  private cellSize: number;

  constructor(
    private readonly el: HTMLElement,
    private readonly actions: TouchActions,
    cellSize: number
  ) {
    this.cellSize = cellSize;

    this.down = (e: PointerEvent) => {
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.lastShiftedX = e.clientX;
      this.active = true;
      this.moved = false;
      this.softHeld = false;
      this.longPressTimer = window.setTimeout(() => {
        if (this.active && !this.moved) {
          this.actions.onHardDrop();
          this.active = false;
        }
      }, LONG_PRESS_MS);
    };

    this.move = (e: PointerEvent) => {
      if (!this.active) return;
      const dx = e.clientX - this.lastShiftedX;
      const dy = e.clientY - this.startY;
      if (Math.abs(dx) >= this.cellSize) {
        this.moved = true;
        this.cancelLongPress();
        if (dx > 0) this.actions.onRight();
        else this.actions.onLeft();
        this.lastShiftedX = e.clientX;
      }
      if (!this.softHeld && dy >= SOFT_DROP_HOLD_PX) {
        this.moved = true;
        this.cancelLongPress();
        this.softHeld = true;
        this.actions.onSoftDrop(true);
      }
    };

    this.up = (e: PointerEvent) => {
      if (!this.active) return;
      this.cancelLongPress();
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (this.softHeld) {
        this.actions.onSoftDrop(false);
      } else if (!this.moved && absX < SWIPE_PX && absY < SWIPE_PX) {
        this.actions.onRotate('cw');
      } else if (absY > absX && absY >= SWIPE_PX) {
        if (dy < 0) this.actions.onHold();
      }

      this.active = false;
      this.softHeld = false;
    };

    this.cancel = () => {
      this.cancelLongPress();
      if (this.softHeld) this.actions.onSoftDrop(false);
      this.active = false;
      this.softHeld = false;
    };

    el.addEventListener('pointerdown', this.down);
    el.addEventListener('pointermove', this.move);
    el.addEventListener('pointerup', this.up);
    el.addEventListener('pointercancel', this.cancel);
    el.style.touchAction = 'none';
  }

  setCellSize(size: number): void {
    this.cellSize = size;
  }

  destroy(): void {
    this.el.removeEventListener('pointerdown', this.down);
    this.el.removeEventListener('pointermove', this.move);
    this.el.removeEventListener('pointerup', this.up);
    this.el.removeEventListener('pointercancel', this.cancel);
    this.el.style.touchAction = '';
    this.cancelLongPress();
  }

  private cancelLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}
