import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'mg-hud',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="hud">
      <div class="stat">
        <span class="label">Moves</span>
        <span class="value">{{ moves() }}</span>
      </div>
      <div class="stat">
        <span class="label">Pairs</span>
        <span class="value">{{ matches() }} / {{ totalPairs() }}</span>
      </div>
      <button class="restart" (click)="restart.emit()">Restart</button>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .hud {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 16px 24px;
      background: linear-gradient(180deg, #0f1730 0%, #0b1020 100%);
      border-radius: 14px;
      border: 1px solid #1f2a4a;
      color: #e6e9f5;
    }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #8a93b8; }
    .value { font-size: 20px; font-weight: 700; }
    .restart {
      margin-left: auto;
      background: linear-gradient(135deg, #4a6cf7, #7b4af7);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .restart:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(74,108,247,0.35); }
  `]
})
export class HudComponent {
  readonly moves = input.required<number>();
  readonly matches = input.required<number>();
  readonly totalPairs = input.required<number>();
  readonly restart = output<void>();
}
