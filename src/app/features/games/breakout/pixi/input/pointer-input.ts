export interface PointerActions {
  readonly onMove: (xLocal: number) => void;
  readonly onPress: () => void;
}

export class PointerInput {
  private readonly down: (e: PointerEvent) => void;
  private readonly move: (e: PointerEvent) => void;

  constructor(
    private readonly el: HTMLElement,
    actions: PointerActions
  ) {
    this.move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * el.clientWidth;
      actions.onMove(x);
    };
    this.down = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * el.clientWidth;
      actions.onMove(x);
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
