import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameEngineService } from '../../../core/game/game-engine.service';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as PuzzleRulesService } from './domain/services/game-engine.service';
import {
  PuzzleConfig,
  pickPuzzleConfig,
  boardPixelSize
} from './domain/models/puzzle-config.model';
import { PuzzleGame } from './puzzle-game';
import { PuzzleHudComponent } from './ui/hud';
import { PuzzleWinModalComponent } from './ui/win-modal';

@Component({
  selector: 'mg-puzzle-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PuzzleHudComponent, PuzzleWinModalComponent, RouterLink],
  providers: [GameStateService, PuzzleRulesService, GameEngineService],
  template: `
    <section class="wrap">
      <a routerLink="/" class="back">← Back to Hub</a>
      <mg-puzzle-hud
        [moves]="state.moves()"
        [elapsedMs]="liveElapsed()"
        [correctCount]="state.correctCount()"
        [totalTiles]="state.totalTiles()"
        [bestMoves]="state.bestMoves()"
        [bestTimeMs]="state.bestTimeMs()"
        [goalTiles]="state.goalTiles()"
        (restart)="restart()"
      />
      <div class="stage" #stage></div>
      <p class="hint">
        <span>Click a tile next to the empty slot to slide</span>
        <span class="dot">·</span>
        <span>Match the goal arrangement</span>
      </p>

      @if (state.isWon()) {
        <mg-puzzle-win-modal
          [moves]="state.moves()"
          [elapsedMs]="state.elapsedMs()"
          [bestMoves]="state.bestMoves()"
          [bestTimeMs]="state.bestTimeMs()"
          [shuffleMoves]="shuffleMoves()"
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
    .hint .dot { color: var(--neon-cyan); }

    @media (max-width: 768px) {
      :host { padding: 16px; }
      .wrap { gap: 12px; width: 100%; }
      .hint { font-size: 10px; letter-spacing: 0.14em; }
    }
  `]
})
export class PuzzleShell implements AfterViewInit {
  private readonly stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly engine = inject(GameEngineService);
  private readonly rules = inject(PuzzleRulesService);
  protected readonly state = inject(GameStateService);

  private game: PuzzleGame | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private readonly _now = signal(performance.now());
  private timeIntervalId: number | null = null;

  protected readonly liveElapsed = computed(() => {
    const start = this.state.startedAt();
    if (!start) return 0;
    const end = this.state.finishedAt();
    if (end) return end - start;
    return this._now() - start;
  });

  protected shuffleMoves(): number {
    return this.state.config()?.shuffleMoves ?? 0;
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timeIntervalId !== null) clearInterval(this.timeIntervalId);
      this.resizeObserver?.disconnect();
      this.engine.destroy();
    });
  }

  async ngAfterViewInit(): Promise<void> {
    await this.boot();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(document.body);
    this.timeIntervalId = window.setInterval(() => this._now.set(performance.now()), 250);
  }

  async restart(): Promise<void> {
    await this.engine.unload();
    this.game = null;
    await this.boot();
  }

  private async boot(): Promise<void> {
    const config = pickPuzzleConfig(window.innerWidth);
    const game = new PuzzleGame(config, this.state, this.rules, this.injector);
    const dims = canvasDims(config);
    await this.engine.start(this.stageRef().nativeElement, game, dims.width, dims.height);
    this.game = game;
  }

  private handleResize(): void {
    if (!this.game) return;
    const config = pickPuzzleConfig(window.innerWidth);
    const dims = canvasDims(config);
    this.engine.resize(dims.width, dims.height);
  }
}

function canvasDims(config: PuzzleConfig): { width: number; height: number } {
  return boardPixelSize(config);
}
