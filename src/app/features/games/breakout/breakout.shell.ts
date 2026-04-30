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
import { GameEngineService as BreakoutRulesService } from './domain/services/game-engine.service';
import {
  BreakoutConfig,
  pickBreakoutConfig
} from './domain/models/breakout-config.model';
import { BreakoutGame } from './breakout-game';
import { BreakoutHudComponent } from './ui/hud';
import { BreakoutGameOverModalComponent } from './ui/game-over-modal';
import { BreakoutVictoryModalComponent } from './ui/victory-modal';

@Component({
  selector: 'mg-breakout-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BreakoutHudComponent,
    BreakoutGameOverModalComponent,
    BreakoutVictoryModalComponent,
    RouterLink
  ],
  providers: [GameStateService, BreakoutRulesService, GameEngineService],
  template: `
    <section class="wrap">
      <a routerLink="/" class="back">← Back to Hub</a>
      <mg-breakout-hud
        [score]="state.score()"
        [bestScore]="state.bestScore()"
        [lives]="state.lives()"
        [maxLives]="initialLives()"
        [levelNumber]="state.levelIndex() + 1"
        [levelName]="levelName()"
        [wideExpiry]="state.activePowerUps().wide"
        [slowExpiry]="state.activePowerUps().slow"
        [laserExpiry]="state.activePowerUps().laser"
        [durationMs]="powerUpDuration()"
        [now]="now()"
        [paused]="state.isPaused()"
        (pause)="rules.togglePause()"
        (restart)="restart()"
      />
      <div class="stage" #stage></div>
      <p class="hint">
        <span>Drag / mouse to move</span>
        <span class="dot">·</span>
        <span>Click or Space to launch & fire</span>
        <span class="dot">·</span>
        <span>Esc to pause</span>
      </p>

      @if (state.isLost()) {
        <mg-breakout-game-over-modal
          [score]="state.score()"
          [level]="state.levelIndex() + 1"
          [elapsedMs]="state.elapsedMs()"
          [bestScore]="state.bestScore()"
          (retry)="restart()"
        />
      }
      @if (state.isWon()) {
        <mg-breakout-victory-modal
          [score]="state.score()"
          [elapsedMs]="state.elapsedMs()"
          [bestScore]="state.bestScore()"
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
      margin: 0; align-self: center;
      display: inline-flex; align-items: center; gap: 10px;
      font-size: 11px; letter-spacing: 0.18em;
      text-transform: uppercase; color: var(--text-faint);
      font-family: var(--font-display);
      flex-wrap: wrap; justify-content: center;
    }
    .hint .dot { color: var(--neon-amber); }

    @media (max-width: 768px) {
      :host { padding: 14px; }
      .wrap { gap: 12px; width: 100%; }
      .hint { font-size: 10px; letter-spacing: 0.14em; }
    }
  `]
})
export class BreakoutShell implements AfterViewInit {
  private readonly stageRef = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly engine = inject(GameEngineService);
  protected readonly rules = inject(BreakoutRulesService);
  protected readonly state = inject(GameStateService);

  private game: BreakoutGame | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private readonly _now = signal(performance.now());
  private timeIntervalId: number | null = null;

  protected readonly now = this._now.asReadonly();

  protected initialLives(): number {
    return this.state.config()?.initialLives ?? 3;
  }
  protected powerUpDuration(): number {
    return this.state.config()?.powerUpDurationMs ?? 15000;
  }
  protected levelName(): string {
    return this.state.currentLevel()?.name ?? '';
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
    this.timeIntervalId = window.setInterval(() => this._now.set(performance.now()), 100);
  }

  async restart(): Promise<void> {
    await this.engine.unload();
    this.game = null;
    await this.boot();
  }

  private async boot(): Promise<void> {
    const config = pickBreakoutConfig(window.innerWidth);
    const game = new BreakoutGame(config, this.state, this.rules, this.injector);
    await this.engine.start(this.stageRef().nativeElement, game, config.fieldWidth, config.fieldHeight);
    this.game = game;
  }

  private handleResize(): void {
    if (!this.game) return;
    const config = pickBreakoutConfig(window.innerWidth);
    this.engine.resize(config.fieldWidth, config.fieldHeight);
  }
}
