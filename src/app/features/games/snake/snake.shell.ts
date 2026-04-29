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
import { GameEngineService as RulesService } from './domain/services/game-engine.service';
import {
  SnakeConfig,
  pickSnakeConfig,
  boardPixelSize
} from './domain/models/snake-config.model';
import { SnakeGame } from './snake-game';
import { SnakeHudComponent } from './ui/hud';
import { SnakeWinModalComponent } from './ui/win-modal';
import { SnakeGameOverModalComponent } from './ui/game-over-modal';

@Component({
  selector: 'mg-snake-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SnakeHudComponent, SnakeWinModalComponent, SnakeGameOverModalComponent, RouterLink],
  providers: [GameStateService, RulesService, GameEngineService],
  template: `
    <section class="wrap">
      <a routerLink="/" class="back">← Back to Hub</a>
      <mg-snake-hud
        [score]="state.score()"
        [length]="state.length()"
        [targetLength]="targetLength()"
        [best]="state.bestScore()"
        [speedLevel]="state.speedLevel()"
        [status]="state.status()"
        (pause)="togglePause()"
        (restart)="restart()"
      />
      <div class="stage" #stage></div>
      <p class="hint">
        <span>Arrows / WASD or swipe to steer</span>
        <span class="dot">·</span>
        <span>Space to pause</span>
      </p>

      @if (state.isWon()) {
        <mg-snake-win-modal
          [score]="state.score()"
          [length]="state.length()"
          [targetLength]="targetLength()"
          [best]="state.bestScore()"
          [elapsedMs]="state.elapsedMs()"
          (replay)="restart()"
        />
      }
      @if (state.isLost()) {
        <mg-snake-game-over-modal
          [score]="state.score()"
          [length]="state.length()"
          [best]="state.bestScore()"
          [elapsedMs]="state.elapsedMs()"
          (retry)="restart()"
        />
      }
    </section>
  `,
  styles: [`
    :host {
      display: flex; justify-content: center; padding: 32px;
      min-height: 100vh; font-family: system-ui, sans-serif;
    }
    .wrap {
      display: flex; flex-direction: column; gap: 16px; position: relative;
      max-width: 100%;
    }
    .back {
      color: var(--text-muted); text-decoration: none; font-size: 13px;
      letter-spacing: 0.04em; align-self: flex-start;
    }
    .back:hover { color: var(--text); }
    .stage { display: flex; justify-content: center; }
    .hint {
      margin: 0;
      align-self: center;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--text-faint);
      font-family: var(--font-display);
    }
    .hint .dot { color: var(--neon-green); }

    @media (max-width: 768px) {
      :host { padding: 16px; }
      .wrap { gap: 12px; width: 100%; }
      .hint { font-size: 10px; letter-spacing: 0.14em; }
    }
  `]
})
export class SnakeShell implements AfterViewInit {
  private readonly stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly engine = inject(GameEngineService);
  private readonly rules = inject(RulesService);
  protected readonly state = inject(GameStateService);

  private game: SnakeGame | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.engine.destroy();
    });
  }

  protected targetLength(): number {
    return this.state.config()?.targetLength ?? 0;
  }

  async ngAfterViewInit(): Promise<void> {
    await this.boot();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(document.body);
  }

  async restart(): Promise<void> {
    await this.engine.unload();
    this.game = null;
    await this.boot();
  }

  togglePause(): void {
    this.rules.togglePause();
  }

  private async boot(): Promise<void> {
    const config = pickSnakeConfig(window.innerWidth);
    const game = new SnakeGame(config, this.state, this.rules, this.injector);
    const dims = canvasDims(config);
    await this.engine.start(this.stageRef().nativeElement, game, dims.width, dims.height);
    this.game = game;
  }

  private handleResize(): void {
    if (!this.game) return;
    const config = pickSnakeConfig(window.innerWidth);
    const dims = canvasDims(config);
    this.engine.resize(dims.width, dims.height);
  }
}

function canvasDims(config: SnakeConfig): { width: number; height: number } {
  return boardPixelSize(config);
}
