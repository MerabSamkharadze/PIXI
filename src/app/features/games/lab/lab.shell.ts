import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  inject,
  viewChild
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameEngineService } from '../../../core/game/game-engine.service';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as LabRulesService } from './domain/services/game-engine.service';
import {
  LabConfig,
  pickLabConfig
} from './domain/models/lab-config.model';
import { LEVELS } from './domain/levels/level-data';
import { LabGame } from './lab-game';
import { LabHudComponent } from './ui/hud';
import { LabLevelCompleteModalComponent } from './ui/level-complete-modal';
import { LabLevelFailedModalComponent } from './ui/level-failed-modal';
import { LabVictoryModalComponent } from './ui/victory-modal';

@Component({
  selector: 'mg-lab-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LabHudComponent,
    LabLevelCompleteModalComponent,
    LabLevelFailedModalComponent,
    LabVictoryModalComponent,
    RouterLink
  ],
  providers: [GameStateService, LabRulesService, GameEngineService],
  template: `
    <section class="wrap">
      <a routerLink="/" class="back">← Back to Hub</a>
      <mg-lab-hud
        [levelIndex]="state.levelIndex()"
        [levelName]="levelName()"
        [goalProgress]="state.goalProgress()"
        [goalTotal]="state.goalTotal()"
        [ballsRemaining]="state.ballsRemaining()"
        [maxBalls]="state.maxBalls()"
        [bestStars]="state.currentBest()"
        [paused]="state.isPaused()"
        (pause)="rules.togglePause()"
        (restart)="rules.retry()"
      />
      <div class="stage" #stage></div>
      <p class="hint">
        <span>Aim with mouse / finger</span>
        <span class="dot">·</span>
        <span>Click or Space to launch</span>
        <span class="dot">·</span>
        <span>R retry · N next · Esc pause</span>
      </p>

      @if (state.isLevelComplete()) {
        <mg-lab-level-complete-modal
          [stars]="state.stars()"
          [levelName]="levelName()"
          [levelIndex]="state.levelIndex()"
          [hasNext]="hasNext()"
          (next)="rules.next()"
          (retry)="rules.retry()"
        />
      }
      @if (state.isLevelFailed()) {
        <mg-lab-level-failed-modal
          [levelName]="levelName()"
          [levelIndex]="state.levelIndex()"
          (retry)="rules.retry()"
        />
      }
      @if (state.isWon()) {
        <mg-lab-victory-modal
          [bestStars]="state.bestStars()"
          [elapsedMs]="state.elapsedMs()"
          (replay)="restartFromZero()"
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
      margin: 0; align-self: center;
      display: inline-flex; align-items: center; gap: 10px;
      font-size: 11px; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--text-faint);
      font-family: var(--font-display);
      flex-wrap: wrap; justify-content: center;
    }
    .hint .dot { color: var(--neon-cyan); }

    @media (max-width: 768px) {
      :host { padding: 14px; }
      .wrap { gap: 12px; width: 100%; }
      .hint { font-size: 10px; letter-spacing: 0.14em; }
    }
  `]
})
export class LabShell implements AfterViewInit {
  private readonly stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly engine = inject(GameEngineService);
  protected readonly rules = inject(LabRulesService);
  protected readonly state = inject(GameStateService);

  private game: LabGame | null = null;
  private resizeObserver: ResizeObserver | null = null;

  protected levelName(): string {
    return this.state.currentLevel()?.name ?? '';
  }
  protected readonly hasNext = computed(() => this.state.levelIndex() + 1 < LEVELS.length);

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

  async restartFromZero(): Promise<void> {
    await this.engine.unload();
    this.game = null;
    await this.boot();
  }

  private async boot(): Promise<void> {
    const config = pickLabConfig(window.innerWidth);
    const game = new LabGame(config, this.state, this.rules, this.injector);
    await this.engine.start(this.stageRef().nativeElement, game, config.fieldWidth, config.fieldHeight);
    this.game = game;
  }

  private handleResize(): void {
    if (!this.game) return;
    const config = pickLabConfig(window.innerWidth);
    this.engine.resize(config.fieldWidth, config.fieldHeight);
  }
}
