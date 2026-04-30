import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { POWERUP_COLORS, POWERUP_LABELS, POWERUP_NAMES, PowerUpType } from '../domain/models/brick.model';

interface PowerChip {
  readonly type: PowerUpType;
  readonly label: string;
  readonly name: string;
  readonly color: string;
  readonly progress: number;
}

@Component({
  selector: 'mg-breakout-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hud">
      <div class="cluster">
        <div class="stat">
          <span class="label">Score</span>
          <span class="value">{{ score() }}</span>
        </div>
        <div class="stat">
          <span class="label">Best</span>
          <span class="value sm">{{ bestScore() }}</span>
        </div>
        <div class="stat lives">
          <span class="label">Lives</span>
          <span class="value hearts">
            @for (i of livesSlots(); track i) {
              <span class="heart" [class.lit]="i < lives()">♥</span>
            }
          </span>
        </div>
        <div class="stat">
          <span class="label">Level</span>
          <span class="value level-num">{{ levelNumber() }}<span class="level-name">— {{ levelName() }}</span></span>
        </div>
      </div>

      <div class="powerups">
        @for (chip of powerChips(); track chip.type) {
          <div class="chip" [style.--chip-color]="chip.color">
            <span class="chip-letter">{{ chip.label }}</span>
            <div class="chip-info">
              <span class="chip-name">{{ chip.name }}</span>
              <div class="chip-bar"><div class="chip-fill" [style.width.%]="chip.progress * 100"></div></div>
            </div>
          </div>
        }
      </div>

      <div class="actions">
        <button type="button" class="btn ghost" (click)="pause.emit()">
          {{ paused() ? 'Resume' : 'Pause' }}
        </button>
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
    .value.sm { font-size: 14px; color: var(--text-muted); }
    .value.level-num {
      color: var(--neon-amber);
      text-shadow: 0 0 12px rgba(245, 158, 11, 0.45);
    }
    .level-name {
      font-size: 11px;
      color: var(--text-muted);
      margin-left: 6px;
      font-weight: 500;
    }
    .hearts { display: inline-flex; gap: 4px; }
    .heart {
      font-size: 18px;
      color: rgba(148, 163, 184, 0.18);
      filter: drop-shadow(0 0 0 transparent);
      transition: color 200ms var(--ease-out);
    }
    .heart.lit {
      color: var(--neon-pink);
      filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.7));
    }

    .powerups {
      display: flex;
      gap: 8px;
      margin-left: auto;
      flex-wrap: wrap;
    }
    .chip {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 6px 10px 6px 6px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--chip-color);
    }
    .chip-letter {
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      background: var(--chip-color);
      color: #020617;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 11px;
    }
    .chip-info { display: flex; flex-direction: column; gap: 3px; min-width: 50px; }
    .chip-name {
      font-family: var(--font-display);
      font-size: 9px;
      letter-spacing: 0.18em;
      color: var(--text-muted);
    }
    .chip-bar {
      width: 60px;
      height: 3px;
      background: rgba(148, 163, 184, 0.18);
      border-radius: 3px;
      overflow: hidden;
    }
    .chip-fill {
      height: 100%;
      background: var(--chip-color);
      transition: width 80ms linear;
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
      background: linear-gradient(135deg, var(--neon-amber), var(--neon-pink));
      box-shadow: 0 8px 22px -10px var(--neon-amber);
    }
    .btn.ghost {
      color: var(--text);
      background: rgba(148,163,184,0.08);
      border-color: var(--border-strong);
    }
    .btn.ghost:hover { color: var(--neon-amber); border-color: var(--neon-amber); }

    @media (max-width: 768px) {
      .hud { gap: 10px; padding: 10px 12px; }
      .cluster { gap: 14px; }
      .powerups { margin-left: 0; width: 100%; }
      .actions { width: 100%; }
      .btn { flex: 1; padding: 10px 12px; }
    }
  `]
})
export class BreakoutHudComponent {
  readonly score = input.required<number>();
  readonly bestScore = input.required<number>();
  readonly lives = input.required<number>();
  readonly maxLives = input.required<number>();
  readonly levelNumber = input.required<number>();
  readonly levelName = input.required<string>();
  readonly wideExpiry = input.required<number | null>();
  readonly slowExpiry = input.required<number | null>();
  readonly laserExpiry = input.required<number | null>();
  readonly durationMs = input.required<number>();
  readonly now = input.required<number>();
  readonly paused = input.required<boolean>();

  readonly pause = output<void>();
  readonly restart = output<void>();

  protected readonly livesSlots = computed(() => {
    const m = Math.max(this.maxLives(), this.lives(), 3);
    return Array.from({ length: m }, (_, i) => i);
  });

  protected readonly powerChips = computed<PowerChip[]>(() => {
    const out: PowerChip[] = [];
    const duration = this.durationMs();
    const now = this.now();

    const entries: Array<[PowerUpType, number | null]> = [
      ['wide', this.wideExpiry()],
      ['slow', this.slowExpiry()],
      ['laser', this.laserExpiry()]
    ];
    for (const [type, expiry] of entries) {
      if (expiry === null) continue;
      const remaining = Math.max(0, expiry - now);
      out.push({
        type,
        label: POWERUP_LABELS[type],
        name: POWERUP_NAMES[type],
        color: '#' + POWERUP_COLORS[type].toString(16).padStart(6, '0'),
        progress: duration > 0 ? remaining / duration : 0
      });
    }
    return out;
  });
}
