import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { COLORS, SHAPES, TetrominoType } from '../domain/models/tetromino.model';

interface MiniCell {
  readonly x: number;
  readonly y: number;
  readonly color: string;
}

@Component({
  selector: 'mg-blocks-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="hud" [class.mobile]="isMobile()">
      <div class="panel hold">
        <span class="label">Hold</span>
        <div class="mini" [class.locked]="holdLocked()">
          @if (holdMini(); as cells) {
            @for (c of cells; track $index) {
              <span class="mini-cell" [style.left.%]="c.x * 25" [style.top.%]="c.y * 25" [style.background]="c.color"></span>
            }
          }
        </div>
      </div>

      <div class="panel stats">
        <div class="stat">
          <span class="label">Score</span>
          <span class="value">{{ score() }}</span>
        </div>
        <div class="stat">
          <span class="label">Best</span>
          <span class="value sm">{{ bestScore() }}</span>
        </div>
        <div class="stat">
          <span class="label">Lines</span>
          <span class="value">{{ lines() }}</span>
        </div>
        <div class="stat level">
          <span class="label">Level</span>
          <span class="value level-num">{{ level() }}</span>
          <div class="level-bar">
            <div class="level-fill" [style.width.%]="levelProgress()"></div>
          </div>
        </div>
      </div>

      <div class="panel next">
        <span class="label">Next</span>
        <div class="next-list">
          @for (mini of nextMinis(); track $index; let first = $first) {
            <div class="mini" [class.large]="first">
              @for (c of mini; track $index) {
                <span class="mini-cell" [style.left.%]="c.x * 25" [style.top.%]="c.y * 25" [style.background]="c.color"></span>
              }
            </div>
          }
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn ghost" (click)="pause.emit()">
          {{ paused() ? 'Resume' : 'Pause' }}
        </button>
        <button type="button" class="btn primary" (click)="restart.emit()">Restart</button>
      </div>
    </aside>
  `,
  styles: [`
    :host { display: block; }
    .hud {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      gap: 14px;
      align-items: stretch;
      padding: 14px 18px;
      background: linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(2,6,23,0.85) 100%);
      border-radius: 14px;
      border: 1px solid var(--border-strong);
      color: var(--text);
      backdrop-filter: var(--blur-glass);
      -webkit-backdrop-filter: var(--blur-glass);
    }
    .hud.mobile { grid-template-columns: 1fr; gap: 10px; padding: 12px; }

    .panel { display: flex; flex-direction: column; gap: 6px; }
    .panel.stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      align-items: center;
    }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .stat.level { gap: 4px; }
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
    .value.sm { font-size: 14px; color: var(--text-muted); }
    .value.level-num {
      font-size: 22px;
      color: var(--neon-pink);
      text-shadow: 0 0 12px rgba(236, 72, 153, 0.55);
    }
    .level-bar {
      width: 100%;
      height: 4px;
      background: rgba(148, 163, 184, 0.18);
      border-radius: 4px;
      overflow: hidden;
    }
    .level-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--neon-pink), var(--neon-violet));
      transition: width 280ms var(--ease-out);
    }

    .mini {
      position: relative;
      width: 60px;
      height: 60px;
      background: rgba(2, 6, 23, 0.55);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .mini.large { width: 76px; height: 76px; }
    .mini.locked { opacity: 0.35; }
    .mini-cell {
      position: absolute;
      width: 22%;
      height: 22%;
      border-radius: 3px;
      box-shadow: 0 0 6px currentColor;
      transform: translate(8%, 8%);
    }
    .mini.large .mini-cell { box-shadow: 0 0 10px currentColor; }

    .panel.next .next-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
    }

    .actions { display: flex; flex-direction: column; gap: 8px; justify-content: center; }
    .btn {
      font-family: var(--font-display);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: transform var(--dur-fast) var(--ease-out),
                  box-shadow var(--dur-fast) var(--ease-out);
    }
    .btn:hover { transform: translateY(-1px); }
    .btn.primary {
      color: #020617;
      background: linear-gradient(135deg, var(--neon-pink), var(--neon-violet));
      box-shadow: 0 8px 22px -10px var(--neon-pink);
    }
    .btn.ghost {
      color: var(--text);
      background: rgba(148,163,184,0.08);
      border-color: var(--border-strong);
    }
    .btn.ghost:hover { color: var(--neon-pink); border-color: var(--neon-pink); }

    @media (max-width: 768px) {
      .hud {
        grid-template-columns: auto 1fr auto;
        grid-template-areas: "hold stats next" "actions actions actions";
      }
      .hud .hold { grid-area: hold; }
      .hud .stats { grid-area: stats; grid-template-columns: repeat(4, auto); gap: 10px; }
      .hud .next { grid-area: next; }
      .hud .actions { grid-area: actions; flex-direction: row; gap: 8px; }
      .hud .actions .btn { flex: 1; }
      .mini { width: 48px; height: 48px; }
      .mini.large { width: 56px; height: 56px; }
      .panel.next .next-list { flex-direction: row; gap: 4px; }
      .panel.next .next-list .mini:nth-child(n+3) { display: none; }
    }
  `]
})
export class BlocksHudComponent {
  readonly score = input.required<number>();
  readonly bestScore = input.required<number>();
  readonly lines = input.required<number>();
  readonly level = input.required<number>();
  readonly linesIntoLevel = input.required<number>();
  readonly linesPerLevel = input.required<number>();
  readonly hold = input.required<TetrominoType | null>();
  readonly holdLocked = input.required<boolean>();
  readonly nextQueue = input.required<readonly TetrominoType[]>();
  readonly paused = input.required<boolean>();
  readonly isMobile = input.required<boolean>();

  readonly pause = output<void>();
  readonly restart = output<void>();

  protected readonly levelProgress = computed(() => {
    const per = this.linesPerLevel();
    if (per <= 0) return 0;
    return (this.linesIntoLevel() / per) * 100;
  });

  protected readonly holdMini = computed<MiniCell[] | null>(() => {
    const h = this.hold();
    return h ? miniFor(h) : null;
  });

  protected readonly nextMinis = computed<MiniCell[][]>(() => {
    return this.nextQueue().map(t => miniFor(t));
  });
}

function miniFor(type: TetrominoType): MiniCell[] {
  const cells = SHAPES[type][0];
  const colorHex = '#' + COLORS[type].toString(16).padStart(6, '0');
  return cells.map(([x, y]) => ({ x, y, color: colorHex }));
}
