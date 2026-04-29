import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GAMES } from '../../games-config';
import { GameCardComponent } from './ui/game-card';

@Component({
  selector: 'mg-hub',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameCardComponent],
  template: `
    <header class="hero">
      <div class="brand">PIXI · Arcade</div>
      <h1>Pick a game.</h1>
      <p>A small platform of WebGL-rendered games. Lazy-loaded, isolated, fast.</p>
    </header>

    <section class="grid">
      @for (g of games; track g.manifest.id) {
        <mg-game-card [manifest]="g.manifest" />
      }
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      padding: 64px 48px 80px;
      font-family: system-ui, sans-serif;
      color: #e6e9f5;
      background:
        radial-gradient(circle at 20% 0%, #1b2550 0%, transparent 55%),
        radial-gradient(circle at 80% 100%, #2a1450 0%, transparent 55%),
        #06080f;
    }
    .hero { max-width: 1080px; margin: 0 auto 40px; }
    .brand {
      font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase;
      color: #8a93b8; margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(32px, 4vw, 48px);
      font-weight: 700;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #e6e9f5 0%, #8a93b8 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    p { margin: 0; color: #8a93b8; max-width: 540px; line-height: 1.6; }
    .grid {
      max-width: 1080px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
    }
  `]
})
export class HubComponent {
  protected readonly games = GAMES;
}
