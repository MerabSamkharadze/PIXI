import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Tile } from '../domain/models/tile.model';

@Component({
  selector: 'mg-puzzle-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hud">
      <div class="cluster">
        <div class="stat">
          <span class="label">Moves</span>
          <span class="value">{{ moves() }}</span>
        </div>
        <div class="stat">
          <span class="label">Time</span>
          <span class="value mono">{{ formattedTime() }}</span>
        </div>
        <div class="stat">
          <span class="label">Correct</span>
          <span class="value">{{ correctCount() }} / {{ totalTiles() }}</span>
        </div>
        <div class="stat best">
          <span class="label">Best</span>
          <span class="value small">
            {{ bestMoves() ?? '—' }} mv
            <span class="dim">·</span>
            {{ bestTimeFormatted() }}
          </span>
        </div>
      </div>

      <div class="goal" [attr.aria-label]="'Goal arrangement'">
        <span class="label">Goal</span>
        <div class="goal-grid">
          @for (t of goalTiles(); track t.id) {
            <span class="goal-cell">{{ t.emoji }}</span>
          }
          <span class="goal-cell empty"></span>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn primary" (click)="restart.emit()">Restart</button>
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
    }
    .value.mono { font-variant-numeric: tabular-nums; }
    .value.small { font-size: 13px; }
    .dim { color: var(--text-faint); margin: 0 4px; }

    .goal {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-left: auto;
    }
    .goal-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2px;
      padding: 4px;
      background: rgba(2, 6, 23, 0.6);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .goal-cell {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      background: rgba(15, 26, 51, 0.7);
      border-radius: 4px;
    }
    .goal-cell.empty { background: transparent; }

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
      transition: transform var(--dur-fast) var(--ease-out),
                  box-shadow var(--dur-fast) var(--ease-out);
    }
    .btn:hover { transform: translateY(-1px); }
    .btn.primary {
      color: #020617;
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-violet));
      box-shadow: 0 8px 22px -10px var(--neon-cyan);
    }

    @media (max-width: 768px) {
      .hud { flex-direction: column; align-items: stretch; gap: 12px; padding: 12px 16px; }
      .cluster { gap: 14px; justify-content: space-between; }
      .goal { margin-left: 0; }
      .goal-cell { width: 18px; height: 18px; font-size: 11px; }
      .actions { width: 100%; }
      .btn { flex: 1; padding: 10px 12px; }
    }
  `]
})
export class PuzzleHudComponent {
  readonly moves = input.required<number>();
  readonly elapsedMs = input.required<number>();
  readonly correctCount = input.required<number>();
  readonly totalTiles = input.required<number>();
  readonly bestMoves = input.required<number | null>();
  readonly bestTimeMs = input.required<number | null>();
  readonly goalTiles = input.required<readonly Tile[]>();

  readonly restart = output<void>();

  protected formattedTime(): string {
    return formatMs(this.elapsedMs());
  }

  protected bestTimeFormatted(): string {
    const t = this.bestTimeMs();
    return t === null ? '—' : formatMs(t);
  }
}

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
