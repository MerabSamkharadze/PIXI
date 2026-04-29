import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { GameStatus } from '../domain/models/snake.model';

@Component({
  selector: 'mg-snake-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hud">
      <div class="cluster">
        <div class="stat">
          <span class="label">Score</span>
          <span class="value">{{ score() }}</span>
        </div>
        <div class="stat">
          <span class="label">Length</span>
          <span class="value">{{ length() }} / {{ targetLength() }}</span>
        </div>
        <div class="stat">
          <span class="label">Best</span>
          <span class="value">{{ best() }}</span>
        </div>
        <div class="stat speed">
          <span class="label">Speed</span>
          <span class="value">
            @for (i of speedSlots; track i) {
              <span class="bar" [class.lit]="i < speedLevel()"></span>
            }
          </span>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn ghost" (click)="pause.emit()">
          {{ isPaused() ? 'Resume' : 'Pause' }}
        </button>
        <button type="button" class="btn primary" (click)="restart.emit()">
          Restart
        </button>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .hud {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 14px 22px;
      background: linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(2,6,23,0.85) 100%);
      border-radius: 14px;
      border: 1px solid var(--border-strong);
      color: var(--text);
      backdrop-filter: var(--blur-glass);
      -webkit-backdrop-filter: var(--blur-glass);
    }
    .cluster {
      display: flex;
      align-items: center;
      gap: 22px;
      flex: 1;
      flex-wrap: wrap;
    }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .label {
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-faint);
      font-family: var(--font-display);
    }
    .value {
      font-family: var(--font-display);
      font-size: 18px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: 0.04em;
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }
    .speed .value { gap: 3px; }
    .bar {
      width: 4px;
      height: 14px;
      border-radius: 2px;
      background: rgba(148,163,184,0.18);
      transition: background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
    }
    .bar.lit {
      background: var(--neon-green);
      box-shadow: 0 0 8px var(--neon-green);
    }

    .actions { display: flex; gap: 10px; }
    .btn {
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
    }
    .btn:hover { transform: translateY(-1px); }
    .btn.primary {
      color: #020617;
      background: linear-gradient(135deg, var(--neon-green), var(--neon-cyan));
      box-shadow: 0 8px 22px -10px var(--neon-green);
    }
    .btn.ghost {
      color: var(--text);
      background: rgba(148,163,184,0.08);
      border-color: var(--border-strong);
    }
    .btn.ghost:hover { color: var(--neon-cyan); border-color: var(--neon-cyan); }

    @media (max-width: 768px) {
      .hud { flex-direction: column; align-items: stretch; gap: 12px; padding: 12px 16px; }
      .cluster { gap: 14px; justify-content: space-between; }
      .actions { width: 100%; }
      .btn { flex: 1; padding: 10px 12px; }
    }
  `]
})
export class SnakeHudComponent {
  readonly score = input.required<number>();
  readonly length = input.required<number>();
  readonly targetLength = input.required<number>();
  readonly best = input.required<number>();
  readonly speedLevel = input.required<number>();
  readonly status = input.required<GameStatus>();

  readonly pause = output<void>();
  readonly restart = output<void>();

  protected readonly speedSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  protected readonly isPaused = computed(() => this.status() === 'paused');
}
