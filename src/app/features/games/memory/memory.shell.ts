import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  inject,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameEngineService } from '../../../core/game/game-engine.service';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as MemoryRulesService } from './domain/services/game-engine.service';
import { DEFAULT_CONFIG } from './domain/models/game-config.model';
import { MemoryGame } from './memory-game';
import { HudComponent } from './ui/hud';

@Component({
  selector: 'mg-memory-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HudComponent, RouterLink],
  providers: [GameStateService, MemoryRulesService, GameEngineService],
  template: `
    <section class="wrap">
      <a routerLink="/" class="back">← Back to Hub</a>
      <mg-hud
        [moves]="state.moves()"
        [matches]="state.matches()"
        [totalPairs]="state.totalPairs()"
        (restart)="restart()"
      />
      <div class="stage" #stage></div>
      @if (state.isWon()) {
        <div class="overlay">
          <div class="card">
            <h2>You won!</h2>
            <p>{{ state.moves() }} moves</p>
            <button (click)="restart()">Play again</button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    :host {
      display: flex; justify-content: center; padding: 32px;
      min-height: 100vh; font-family: system-ui, sans-serif;
      background:
        radial-gradient(circle at 20% 0%, #1b2550 0%, transparent 60%),
        radial-gradient(circle at 80% 100%, #2a1450 0%, transparent 55%),
        #06080f;
    }
    .wrap { display: flex; flex-direction: column; gap: 16px; position: relative; }
    .back {
      color: #8a93b8; text-decoration: none; font-size: 13px;
      letter-spacing: 0.04em; align-self: flex-start;
    }
    .back:hover { color: #e6e9f5; }
    .stage { display: flex; justify-content: center; }
    .overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(6,8,15,0.6); backdrop-filter: blur(6px);
      border-radius: 14px;
    }
    .card {
      background: #0f1730; padding: 32px 40px; border-radius: 16px;
      border: 1px solid #2a3358; color: #e6e9f5; text-align: center;
    }
    .card h2 { margin: 0 0 8px; }
    .card button {
      margin-top: 16px; padding: 10px 20px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #4a6cf7, #7b4af7); color: white;
      font-weight: 600; cursor: pointer;
    }
  `]
})
export class MemoryShell implements AfterViewInit {
  private readonly stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly engine = inject(GameEngineService);
  private readonly rules = inject(MemoryRulesService);
  protected readonly state = inject(GameStateService);

  private game: MemoryGame | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.engine.destroy());
  }

  async ngAfterViewInit(): Promise<void> {
    await this.boot();
  }

  async restart(): Promise<void> {
    await this.engine.unload();
    this.game = null;
    await this.boot();
  }

  private async boot(): Promise<void> {
    const config = DEFAULT_CONFIG;
    const game = new MemoryGame(config, this.state, this.rules, this.injector);
    const width = config.cols * config.cardSize + (config.cols - 1) * config.gap;
    const height = config.rows * config.cardSize + (config.rows - 1) * config.gap;
    await this.engine.start(this.stageRef().nativeElement, game, width, height);
    this.game = game;
  }
}
