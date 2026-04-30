import { RotDirection } from '../../domain/models/tetromino.model';

export interface KeyboardActions {
  readonly onLeft: () => void;
  readonly onRight: () => void;
  readonly onSoftDrop: (active: boolean) => void;
  readonly onHardDrop: () => void;
  readonly onRotate: (direction: RotDirection) => void;
  readonly onHold: () => void;
  readonly onPause: () => void;
}

const DAS_MS = 170;
const ARR_MS = 50;

export class KeyboardInput {
  private readonly down: (e: KeyboardEvent) => void;
  private readonly up: (e: KeyboardEvent) => void;
  private dasInterval: number | null = null;
  private dasTimeout: number | null = null;
  private heldDirection: 'left' | 'right' | null = null;

  constructor(private readonly actions: KeyboardActions) {
    this.down = (e: KeyboardEvent) => {
      if (this.shouldIgnore(e)) return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          if (this.heldDirection !== 'left') {
            this.heldDirection = 'left';
            this.actions.onLeft();
            this.startDas('left');
          }
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          if (this.heldDirection !== 'right') {
            this.heldDirection = 'right';
            this.actions.onRight();
            this.startDas('right');
          }
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          if (!e.repeat) this.actions.onSoftDrop(true);
          break;
        case 'Space':
          e.preventDefault();
          if (!e.repeat) this.actions.onHardDrop();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'KeyX':
          e.preventDefault();
          if (!e.repeat) this.actions.onRotate('cw');
          break;
        case 'KeyZ':
        case 'ControlLeft':
        case 'ControlRight':
          e.preventDefault();
          if (!e.repeat) this.actions.onRotate('ccw');
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'KeyC':
          e.preventDefault();
          if (!e.repeat) this.actions.onHold();
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
          if (this.heldDirection === 'left') this.stopDas();
          break;
        case 'ArrowRight':
        case 'KeyD':
          if (this.heldDirection === 'right') this.stopDas();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.actions.onSoftDrop(false);
          break;
      }
    };

    window.addEventListener('keydown', this.down);
    window.addEventListener('keyup', this.up);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.down);
    window.removeEventListener('keyup', this.up);
    this.stopDas();
    this.actions.onSoftDrop(false);
  }

  private shouldIgnore(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    if (!target) return false;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true;
    if (target.isContentEditable) return true;
    return false;
  }

  private startDas(direction: 'left' | 'right'): void {
    this.stopDas();
    this.heldDirection = direction;
    this.dasTimeout = window.setTimeout(() => {
      this.dasInterval = window.setInterval(() => {
        if (this.heldDirection === 'left') this.actions.onLeft();
        else if (this.heldDirection === 'right') this.actions.onRight();
      }, ARR_MS);
    }, DAS_MS);
  }

  private stopDas(): void {
    this.heldDirection = null;
    if (this.dasTimeout !== null) {
      clearTimeout(this.dasTimeout);
      this.dasTimeout = null;
    }
    if (this.dasInterval !== null) {
      clearInterval(this.dasInterval);
      this.dasInterval = null;
    }
  }
}
