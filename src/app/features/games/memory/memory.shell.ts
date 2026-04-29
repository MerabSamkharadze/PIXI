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
import { GameConfig, pickMemoryConfig } from './domain/models/game-config.model';
import { MemoryGame } from './memory-game';
import { HudComponent } from './ui/hud';
import { WinModalComponent } from './ui/win-modal';

@Component({
  selector: 'mg-memory-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HudComponent, WinModalComponent, RouterLink],
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
        <mg-win-modal
          [moves]="state.moves()"
          [totalPairs]="state.totalPairs()"
          [elapsedMs]="state.elapsedMs()"
          (replay)="restart()"
        />
      }
    </section>
  `,
  styles: [`
    :host {
      display: flex; justify-content: center; padding: 32px;
      min-height: 100vh; font-family: system-ui, sans-serif;
    }
    .wrap { display: flex; flex-direction: column; gap: 16px; position: relative; }
    .back {
      color: var(--text-muted); text-decoration: none; font-size: 13px;
      letter-spacing: 0.04em; align-self: flex-start;
    }
    .back:hover { color: var(--text); }
    .stage { display: flex; justify-content: center; }

    @media (max-width: 768px) {
      :host { padding: 16px; }
      .wrap { gap: 12px; width: 100%; }
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
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.engine.destroy();
    });
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

  private async boot(): Promise<void> {
    const config = pickMemoryConfig(window.innerWidth);
    const game = new MemoryGame(config, this.state, this.rules, this.injector);
    const dims = canvasDims(config);
    await this.engine.start(this.stageRef().nativeElement, game, dims.width, dims.height);
    this.game = game;
  }

  private handleResize(): void {
    if (!this.game) return;
    const config = pickMemoryConfig(window.innerWidth);
    const dims = canvasDims(config);
    this.engine.resize(dims.width, dims.height);
  }
}

function canvasDims(config: GameConfig): { width: number; height: number } {
  const innerW = config.cols * config.cardSize + (config.cols - 1) * config.gap;
  const innerH = config.rows * config.cardSize + (config.rows - 1) * config.gap;
  const pad = config.boardPadding * 2;
  return { width: innerW + pad, height: innerH + pad };
}
