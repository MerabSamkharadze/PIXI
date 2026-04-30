export interface PointerActions {
  readonly onMove: (x: number, y: number) => void;
  readonly onPress: () => void;
}

export class PointerInput {
  private readonly down: (e: PointerEvent) => void;
  private readonly move: (e: PointerEvent) => void;

  constructor(private readonly el: HTMLElement, actions: PointerActions) {
    const toLocal = (e: PointerEvent): { x: number; y: number } => {
      const rect = el.getBoundingClientRect();
      const sx = el.clientWidth / rect.width;
      const sy = el.clientHeight / rect.height;
      return {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top) * sy
      };
    };
    this.move = (e: PointerEvent) => {
      const p = toLocal(e);
      actions.onMove(p.x, p.y);
    };
    this.down = (e: PointerEvent) => {
      const p = toLocal(e);
      actions.onMove(p.x, p.y);
      actions.onPress();
    };
    el.addEventListener('pointerdown', this.down);
    el.addEventListener('pointermove', this.move);
    el.style.touchAction = 'none';
  }

  destroy(): void {
    this.el.removeEventListener('pointerdown', this.down);
    this.el.removeEventListener('pointermove', this.move);
    this.el.style.touchAction = '';
  }
}
