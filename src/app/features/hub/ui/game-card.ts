import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameManifest } from '../../../core/game/game.types';

@Component({
  selector: 'mg-game-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @let m = manifest();
    <a
      class="card"
      [class.disabled]="m.disabled"
      [routerLink]="m.disabled ? null : ['/games', m.id]"
      [style.--accent]="m.accent"
    >
      <div class="thumb">{{ m.thumbnail }}</div>
      <div class="body">
        <h3>{{ m.title }}</h3>
        <p>{{ m.description }}</p>
        <div class="tags">
          @for (tag of m.tags; track tag) {
            <span class="tag">{{ tag }}</span>
          }
        </div>
      </div>
      @if (m.disabled) {
        <div class="badge">soon</div>
      }
    </a>
  `,
  styles: [`
    :host { display: block; }
    .card {
      --accent: #4a6cf7;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      min-height: 220px;
      background: linear-gradient(180deg, #131c3a 0%, #0d1430 100%);
      border: 1px solid #1f2a4a;
      border-radius: 18px;
      color: #e6e9f5;
      text-decoration: none;
      overflow: hidden;
      transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
      cursor: pointer;
    }
    .card::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(circle at 0% 0%, color-mix(in oklab, var(--accent) 28%, transparent), transparent 55%);
      opacity: 0.6;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: var(--accent);
      box-shadow: 0 18px 40px -18px color-mix(in oklab, var(--accent) 50%, transparent);
    }
    .card:hover::before { opacity: 1; }
    .card.disabled {
      opacity: 0.55;
      pointer-events: none;
      filter: grayscale(0.4);
    }
    .thumb {
      width: 64px; height: 64px;
      display: flex; align-items: center; justify-content: center;
      font-size: 36px;
      background: rgba(255,255,255,0.04);
      border: 1px solid #1f2a4a;
      border-radius: 14px;
    }
    h3 { margin: 0 0 6px; font-size: 18px; font-weight: 700; }
    p { margin: 0 0 14px; color: #8a93b8; font-size: 13px; line-height: 1.5; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
      padding: 4px 8px; border-radius: 6px;
      background: rgba(255,255,255,0.05); color: #b6bcd8;
    }
    .badge {
      position: absolute; top: 14px; right: 14px;
      font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
      padding: 4px 8px; border-radius: 6px;
      background: rgba(255,255,255,0.08); color: #e6e9f5;
    }
  `]
})
export class GameCardComponent {
  readonly manifest = input.required<GameManifest>();
}
