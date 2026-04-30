import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'mg-blocks-mobile-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <div class="group">
        <button type="button" class="ctrl" (pointerdown)="emitDown('left', $event)" (pointerup)="emitUp('left', $event)" (pointercancel)="emitUp('left', $event)" aria-label="Move left">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,6 9,12 15,18"/></svg>
        </button>
        <button type="button" class="ctrl" (pointerdown)="rotateCcw.emit()" aria-label="Rotate counter-clockwise">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3,3 3,8 8,8"/></svg>
        </button>
      </div>

      <div class="group">
        <button type="button" class="ctrl" (pointerdown)="softDown($event)" (pointerup)="softUp($event)" (pointercancel)="softUp($event)" aria-label="Soft drop">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,9 12,15 18,9"/></svg>
        </button>
        <button type="button" class="ctrl" (pointerdown)="rotateCw.emit()" aria-label="Rotate clockwise">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21,3 21,8 16,8"/></svg>
        </button>
      </div>

      <div class="group">
        <button type="button" class="ctrl drop" (pointerdown)="hardDrop.emit()" aria-label="Hard drop">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="17"/><polyline points="6,11 12,17 18,11"/><line x1="5" y1="21" x2="19" y2="21"/></svg>
        </button>
        <button type="button" class="ctrl" (pointerdown)="hold.emit()" aria-label="Hold piece">
          <span class="hold-label">HOLD</span>
        </button>
      </div>

      <div class="group">
        <button type="button" class="ctrl" (pointerdown)="emitDown('right', $event)" (pointerup)="emitUp('right', $event)" (pointercancel)="emitUp('right', $event)" aria-label="Move right">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,6 15,12 9,18"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: sticky;
      bottom: 0;
      width: 100%;
      pointer-events: none;
    }
    .bar {
      display: flex;
      gap: 12px;
      padding: 10px 12px env(safe-area-inset-bottom) 12px;
      justify-content: space-between;
      pointer-events: auto;
      background: linear-gradient(180deg, rgba(15,23,42,0.6) 0%, rgba(2,6,23,0.92) 100%);
      border-top: 1px solid var(--border-strong);
      backdrop-filter: var(--blur-glass);
      -webkit-backdrop-filter: var(--blur-glass);
    }
    .group { display: flex; gap: 8px; }
    .ctrl {
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.6);
      color: var(--text);
      cursor: pointer;
      touch-action: manipulation;
      transition: transform 80ms var(--ease-out), background 120ms var(--ease-out), border-color 120ms var(--ease-out);
    }
    .ctrl:active {
      transform: scale(0.92);
      background: rgba(236, 72, 153, 0.18);
      border-color: var(--neon-pink);
      color: var(--neon-pink);
    }
    .ctrl.drop {
      background: linear-gradient(135deg, rgba(236,72,153,0.25), rgba(168,85,247,0.25));
      border-color: rgba(236,72,153,0.45);
      color: var(--neon-pink);
    }
    .ctrl.drop:active {
      background: linear-gradient(135deg, var(--neon-pink), var(--neon-violet));
      color: #020617;
    }
    .hold-label {
      font-family: var(--font-display);
      font-size: 10px;
      letter-spacing: 0.18em;
      font-weight: 700;
    }
  `]
})
export class BlocksMobileControlsComponent {
  readonly left = output<void>();
  readonly right = output<void>();
  readonly leftRelease = output<void>();
  readonly rightRelease = output<void>();
  readonly rotateCw = output<void>();
  readonly rotateCcw = output<void>();
  readonly softDrop = output<boolean>();
  readonly hardDrop = output<void>();
  readonly hold = output<void>();

  protected emitDown(dir: 'left' | 'right', e: PointerEvent): void {
    e.preventDefault();
    if (dir === 'left') this.left.emit();
    else this.right.emit();
  }

  protected emitUp(dir: 'left' | 'right', e: PointerEvent): void {
    e.preventDefault();
    if (dir === 'left') this.leftRelease.emit();
    else this.rightRelease.emit();
  }

  protected softDown(e: PointerEvent): void {
    e.preventDefault();
    this.softDrop.emit(true);
  }

  protected softUp(e: PointerEvent): void {
    e.preventDefault();
    this.softDrop.emit(false);
  }
}
