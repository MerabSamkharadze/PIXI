import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'mg-lab-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hud">
      <div class="cluster">
        <div class="stat">
          <span class="label">Lab</span>
          <span class="value level-num">{{ levelDisplay() }}</span>
          <span class="level-name">{{ levelName() }}</span>
        </div>
        <div class="stat">
          <span class="label">Goals</span>
          <span class="value">{{ goalProgress() }} / {{ goalTotal() }}</span>
          <div class="progress">
            <div class="progress-fill" [style.width.%]="goalPercent()"></div>
          </div>
        </div>
        <div class="stat">
          <span class="label">Balls</span>
          <span class="value balls">
            @for (i of ballSlots(); track i) {
              <span class="ball" [class.lit]="i < ballsRemaining()"></span>
            }
          </span>
        </div>
        <div class="stat">
          <span class="label">Best</span>
          <span class="value stars">
            @for (i of starSlots; track i) {
              <span class="star" [class.lit]="i < bestStars()">★</span>
            }
          </span>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn ghost" (click)="pause.emit()">{{ paused() ? 'Resume' : 'Pause' }}</button>
        <button type="button" class="btn primary" (click)="restart.emit()">Restart</button>
      </div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .hud {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 22px;
      background: linear-gradient(180deg, rgba(15,23,42,0.78) 0%, rgba(2,6,23,0.85) 100%);
      border-radius: 14px;
      border: 1px solid var(--border-strong);
      color: var(--text);
      backdrop-filter: var(--blur-glass);
      -webkit-backdrop-filter: var(--blur-glass);
      flex-wrap: wrap;
    }
    .cluster {
      display: flex;
      align-items: center;
      gap: 22px;
      flex-wrap: wrap;
      flex: 1;
    }
    .stat { display: flex; flex-direction: column; gap: 2px; min-width: 80px; }
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
    .value.level-num {
      color: var(--neon-cyan);
      text-shadow: 0 0 12px rgba(34, 211, 238, 0.45);
    }
    .level-name {
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-top: 1px;
    }

    .progress {
      width: 80px;
      height: 4px;
      background: rgba(148, 163, 184, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--neon-cyan), var(--neon-green));
      transition: width 280ms var(--ease-out);
    }

    .balls { display: inline-flex; gap: 4px; }
    .ball {
      width: 12px; height: 12px; border-radius: 50%;
      background: rgba(148, 163, 184, 0.18);
      transition: background 200ms var(--ease-out);
    }
    .ball.lit {
      background: radial-gradient(circle, #fde68a, #f59e0b);
      box-shadow: 0 0 6px rgba(245, 158, 11, 0.7);
    }

    .stars { display: inline-flex; gap: 3px; }
    .star {
      font-size: 16px;
      color: rgba(148, 163, 184, 0.18);
    }
    .star.lit {
      color: var(--neon-amber);
      filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.7));
    }

    .actions { display: flex; gap: 10px; }
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
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-violet));
      box-shadow: 0 8px 22px -10px var(--neon-cyan);
    }
    .btn.ghost {
      color: var(--text);
      background: rgba(148,163,184,0.08);
      border-color: var(--border-strong);
    }
    .btn.ghost:hover { color: var(--neon-cyan); border-color: var(--neon-cyan); }

    @media (max-width: 768px) {
      .hud { gap: 10px; padding: 10px 14px; }
      .cluster { gap: 14px; }
      .actions { width: 100%; }
      .btn { flex: 1; padding: 10px 12px; }
    }
  `]
})
export class LabHudComponent {
  readonly levelIndex = input.required<number>();
  readonly levelName = input.required<string>();
  readonly goalProgress = input.required<number>();
  readonly goalTotal = input.required<number>();
  readonly ballsRemaining = input.required<number>();
  readonly maxBalls = input.required<number>();
  readonly bestStars = input.required<number>();
  readonly paused = input.required<boolean>();

  readonly pause = output<void>();
  readonly restart = output<void>();

  protected readonly starSlots = [0, 1, 2];

  protected readonly levelDisplay = computed(() =>
    `LAB ${(this.levelIndex() + 1).toString().padStart(2, '0')}`
  );

  protected readonly goalPercent = computed(() => {
    const t = this.goalTotal();
    if (t <= 0) return 0;
    return Math.min(100, (this.goalProgress() / t) * 100);
  });

  protected readonly ballSlots = computed(() =>
    Array.from({ length: this.maxBalls() }, (_, i) => i)
  );
}
