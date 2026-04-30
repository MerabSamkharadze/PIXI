import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameEngineService } from '../../../core/game/game-engine.service';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as BlocksRulesService } from './domain/services/game-engine.service';
import {
  BlocksConfig,
  fieldPixelSize,
  pickBlocksConfig
} from './domain/models/blocks-config.model';
import { MOBILE_BREAKPOINT } from '../../../core/responsive/breakpoint';
import { BlocksGame } from './blocks-game';
import { BlocksHudComponent } from './ui/hud';
import { BlocksMobileControlsComponent } from './ui/mobile-controls';
import { BlocksGameOverModalComponent } from './ui/game-over-modal';

@Component({
  selector: 'mg-blocks-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BlocksHudComponent,
    BlocksMobileControlsComponent,
    BlocksGameOverModalComponent,
    RouterLink
  ],
  providers: [GameStateService, BlocksRulesService, GameEngineService],
  template: `
    <section class="wrap" [class.mobile]="isMobile()">
      <a routerLink="/" class="back">← Back to Hub</a>
      <mg-blocks-hud
        [score]="state.score()"
        [bestScore]="state.bestScore()"
        [lines]="state.lines()"
        [level]="state.level()"
        [linesIntoLevel]="state.linesIntoLevel()"
        [linesPerLevel]="linesPerLevel()"
        [hold]="state.hold()"
        [holdLocked]="state.holdLocked()"
        [nextQueue]="state.nextQueue()"
        [paused]="state.isPaused()"
        [isMobile]="isMobile()"
        (pause)="togglePause()"
        (restart)="restart()"
      />
      <div class="stage" #stage></div>
      <p class="hint">
        @if (isMobile()) {
          <span>Tap to rotate · swipe to move · long-press to drop</span>
        } @else {
          <span>← → move</span>
          <span class="dot">·</span>
          <span>↑ / X rotate</span>
          <span class="dot">·</span>
          <span>Space hard drop</span>
          <span class="dot">·</span>
          <span>C hold</span>
        }
      </p>

      @if (isMobile()) {
        <mg-blocks-mobile-controls
          (left)="onLeft()"
          (right)="onRight()"
          (leftRelease)="onMoveRelease()"
          (rightRelease)="onMoveRelease()"
          (rotateCw)="rules.rotate('cw')"
          (rotateCcw)="rules.rotate('ccw')"
          (softDrop)="onSoftDrop($event)"
          (hardDrop)="rules.hardDrop()"
          (hold)="rules.hold()"
        />
      }

      @if (state.isLost()) {
        <mg-blocks-game-over-modal
          [score]="state.score()"
          [lines]="state.lines()"
          [level]="state.level()"
          [elapsedMs]="state.elapsedMs()"
          [bestScore]="state.bestScore()"
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
      flex-wrap: wrap;
      justify-content: center;
    }
    .hint .dot { color: var(--neon-pink); }

    @media (max-width: 768px) {
      :host { padding: 12px 12px 0; }
      .wrap { gap: 10px; width: 100%; padding-bottom: 90px; }
      .hint { font-size: 10px; letter-spacing: 0.14em; }
      mg-blocks-mobile-controls {
        position: fixed;
        left: 0; right: 0; bottom: 0;
      }
    }
  `]
})
export class BlocksShell implements AfterViewInit {
  private readonly stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly engine = inject(GameEngineService);
  protected readonly rules = inject(BlocksRulesService);
  protected readonly state = inject(GameStateService);

  private game: BlocksGame | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly _viewportWidth = signal(window.innerWidth);

  protected readonly isMobile = computed(() => this._viewportWidth() < MOBILE_BREAKPOINT);

  protected linesPerLevel(): number {
    return this.state.config()?.linesPerLevel ?? 10;
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.engine.destroy();
    });

    effect(() => {
      const lost = this.state.isLost();
      if (lost) this.rules.setSoftDrop(false);
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

  togglePause(): void {
    this.rules.togglePause();
  }

  protected onLeft(): void { this.rules.moveLeft(); }
  protected onRight(): void { this.rules.moveRight(); }
  protected onMoveRelease(): void { /* DAS not implemented in mobile controls v1 */ }
  protected onSoftDrop(active: boolean): void { this.rules.setSoftDrop(active); }

  private async boot(): Promise<void> {
    const config = pickBlocksConfig(window.innerWidth);
    const game = new BlocksGame(config, this.state, this.rules, this.injector);
    const dims = canvasDims(config);
    await this.engine.start(this.stageRef().nativeElement, game, dims.width, dims.height);
    this.game = game;
  }

  private handleResize(): void {
    this._viewportWidth.set(window.innerWidth);
    if (!this.game) return;
    const config = pickBlocksConfig(window.innerWidth);
    const dims = canvasDims(config);
    this.engine.resize(dims.width, dims.height);
  }
}

function canvasDims(config: BlocksConfig): { width: number; height: number } {
  return fieldPixelSize(config);
}
