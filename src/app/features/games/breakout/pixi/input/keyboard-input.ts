export interface KeyboardActions {
  readonly onDir: (dir: -1 | 0 | 1) => void;
  readonly onPress: () => void;
  readonly onPause: () => void;
}

export class KeyboardInput {
  private readonly down: (e: KeyboardEvent) => void;
  private readonly up: (e: KeyboardEvent) => void;
  private leftHeld = false;
  private rightHeld = false;

  constructor(private readonly actions: KeyboardActions) {
    this.down = (e: KeyboardEvent) => {
      if (this.shouldIgnore(e)) return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          if (!this.leftHeld) {
            this.leftHeld = true;
            this.applyDir();
          }
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          if (!this.rightHeld) {
            this.rightHeld = true;
            this.applyDir();
          }
          break;
        case 'Space':
          e.preventDefault();
          if (!e.repeat) this.actions.onPress();
          break;
        case 'Escape':
        case 'KeyP':
          e.preventDefault();
          if (!e.repeat) this.actions.onPause();
          break;
      }
    };
    this.up = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.leftHeld = false;
          this.applyDir();
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.rightHeld = false;
          this.applyDir();
          break;
      }
    };
    window.addEventListener('keydown', this.down);
    window.addEventListener('keyup', this.up);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
    this.actions.onDir(0);
  }

  private shouldIgnore(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true;
    if (target.isContentEditable) return true;
    return false;
  }

  private applyDir(): void {
    const dir: -1 | 0 | 1 = this.leftHeld && !this.rightHeld ? -1 : (this.rightHeld && !this.leftHeld ? 1 : 0);
    this.actions.onDir(dir);
  }
}
