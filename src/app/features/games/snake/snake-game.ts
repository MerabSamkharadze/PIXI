import { EffectRef, Injector, effect } from '@angular/core';
import { Container, Ticker } from 'pixi.js';
import { BasePixiGame } from '../../../core/game/base-pixi-game';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as RulesService } from './domain/services/game-engine.service';
import {
  SnakeConfig,
  pickSnakeConfig,
  boardPixelSize
} from './domain/models/snake-config.model';
import { ArenaRenderer } from './pixi/renderers/arena.renderer';
import { SnakeRenderer } from './pixi/renderers/snake.renderer';
import { FoodRenderer } from './pixi/renderers/food.renderer';
import { ParticleRenderer } from './pixi/renderers/particle.renderer';
import { ScorePopupRenderer } from './pixi/renderers/score-popup.renderer';
import { FlashRenderer } from './pixi/renderers/flash.renderer';
import { KeyboardInput } from './pixi/input/keyboard-input';
import { SwipeInput } from './pixi/input/swipe-input';

const SHAKE_MS = 280;
const SHAKE_AMPLITUDE = 8;
const POPUP_POINTS = 10;

export class SnakeGame extends BasePixiGame {
  readonly id = 'snake';

  private config: SnakeConfig;

  private playRoot: Container | null = null;
  private arena: ArenaRenderer | null = null;
  private snakeR: SnakeRenderer | null = null;
  private foodR: FoodRenderer | null = null;
  private particles: ParticleRenderer | null = null;
  private popups: ScorePopupRenderer | null = null;
  private flash: FlashRenderer | null = null;

  private ticker: Ticker | null = null;
  private accum = 0;
  private shakeMs = 0;
  private baseX = 0;
  private baseY = 0;

  private keyboard: KeyboardInput | null = null;
  private swipe: SwipeInput | null = null;
  private effects: EffectRef[] = [];

  constructor(
    config: SnakeConfig,
    private readonly state: GameStateService,
    private readonly rules: RulesService,
    private readonly injector: Injector
  ) {
    super();
    this.config = config;
  }

  protected init(): void {
    const playRoot = new Container();
    this.root.addChild(playRoot);
    this.playRoot = playRoot;

    this.arena = new ArenaRenderer(this.config);
    this.foodR = new FoodRenderer(this.config);
    this.snakeR = new SnakeRenderer(this.config);
    this.particles = new ParticleRenderer();
    this.popups = new ScorePopupRenderer();
    this.flash = new FlashRenderer();

    playRoot.addChild(
      this.arena.view,
      this.foodR.view,
      this.snakeR.view,
      this.particles.view,
      this.popups.view,
      this.flash.view
    );

    this.applyFlashSize();
    this.center();

    this.keyboard = new KeyboardInput(
      d => this.rules.queueDirection(d),
      () => this.rules.togglePause()
    );
    this.swipe = new SwipeInput(this.ctx.app.canvas, d => this.rules.queueDirection(d));

    this.ticker = new Ticker();
    this.ticker.add(t => this.frame(t.deltaMS));
    this.ticker.start();

    this.rules.start(this.config);

    this.effects.push(
      effect(
        () => {
          const food = this.state.food();
          this.foodR?.update(food);
        },
        { injector: this.injector }
      )
    );

    this.effects.push(
      effect(
        () => {
          const eaten = this.state.lastEatenFood();
          if (!eaten) return;
          const { cellSize, boardPadding } = this.config;
          const px = boardPadding + eaten.x * cellSize + cellSize / 2;
          const py = boardPadding + eaten.y * cellSize + cellSize / 2;
          const color = hslToHex(eaten.hue, 0.85, 0.6);
          this.particles?.burst(px, py, color);
          this.popups?.show(px, py - cellSize * 0.6, POPUP_POINTS);
          this.snakeR?.squash();
        },
        { injector: this.injector }
      )
    );

    this.effects.push(
      effect(
        () => {
          const status = this.state.status();
          if (status === 'lost') {
            this.snakeR?.render(this.state.snake(), this.state.snake(), 1, this.state.direction());
            this.snakeR?.startDying();
            this.flash?.trigger();
            this.shakeMs = SHAKE_MS;
          }
        },
        { injector: this.injector }
      )
    );
  }

  resize(width: number, height: number): void {
    if (!this.snakeR) return;
    const next = pickSnakeConfig(window.innerWidth);
    if (next !== this.config) {
      this.config = next;
      this.snakeR.setConfig(next);
      this.foodR?.setConfig(next);
      this.arena?.setConfig(next);
      this.applyFlashSize();
      if (this.state.isPlaying() || this.state.isPaused()) {
        this.rules.start(next);
        this.accum = 0;
      } else if (this.state.isLost() || this.state.isWon()) {
        this.rules.start(next);
        this.accum = 0;
      }
    }
    const size = boardPixelSize(this.config);
    this.baseX = (width - size.width) / 2;
    this.baseY = (height - size.height) / 2;
    this.playRoot?.position.set(this.baseX, this.baseY);
  }

  protected onDestroy(): void {
    this.effects.forEach(e => e.destroy());
    this.effects = [];
    this.ticker?.destroy();
    this.ticker = null;
    this.keyboard?.destroy();
    this.keyboard = null;
    this.swipe?.destroy();
    this.swipe = null;
    this.arena?.destroy();
    this.snakeR?.destroy();
    this.foodR?.destroy();
    this.particles?.destroy();
    this.popups?.destroy();
    this.flash?.destroy();
    this.arena = null;
    this.snakeR = null;
    this.foodR = null;
    this.particles = null;
    this.popups = null;
    this.flash = null;
    this.playRoot = null;
  }

  private center(): void {
    const size = boardPixelSize(this.config);
    this.baseX = (this.ctx.width - size.width) / 2;
    this.baseY = (this.ctx.height - size.height) / 2;
    this.playRoot?.position.set(this.baseX, this.baseY);
  }

  private applyFlashSize(): void {
    if (!this.flash) return;
    const size = boardPixelSize(this.config);
    this.flash.setSize(size.width, size.height);
  }

  private frame(deltaMs: number): void {
    const status = this.state.status();
    if (status === 'playing') {
      const tickMs = this.state.tickMs();
      this.accum += deltaMs;
      while (this.accum >= tickMs) {
        this.rules.tick();
        this.accum -= tickMs;
        if (this.state.status() !== 'playing') break;
      }
    }

    const currStatus = this.state.status();
    if (currStatus === 'lost') {
      this.snakeR?.tickDying(this.state.snake(), deltaMs);
    } else if (currStatus === 'won') {
      this.snakeR?.render(this.state.snake(), this.state.snake(), 1, this.state.direction());
    } else if (currStatus === 'playing') {
      const t = Math.min(1, this.accum / this.state.tickMs());
      this.snakeR?.render(this.state.prevSnake(), this.state.snake(), t, this.state.direction());
    } else if (currStatus === 'paused') {
      this.snakeR?.render(this.state.prevSnake(), this.state.snake(), 1, this.state.direction());
    } else {
      this.snakeR?.render(this.state.snake(), this.state.snake(), 0, this.state.direction());
    }

    this.foodR?.tick(deltaMs);
    this.particles?.tick(deltaMs);
    this.popups?.tick(deltaMs);
    this.flash?.tick(deltaMs);

    if (this.shakeMs > 0 && this.playRoot) {
      this.shakeMs = Math.max(0, this.shakeMs - deltaMs);
      const intensity = (this.shakeMs / SHAKE_MS) * SHAKE_AMPLITUDE;
      const sx = (Math.random() * 2 - 1) * intensity;
      const sy = (Math.random() * 2 - 1) * intensity;
      this.playRoot.position.set(this.baseX + sx, this.baseY + sy);
    } else if (
      this.playRoot &&
      (this.playRoot.position.x !== this.baseX || this.playRoot.position.y !== this.baseY)
    ) {
      this.playRoot.position.set(this.baseX, this.baseY);
    }
  }
}

function hslToHex(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return (R << 16) | (G << 8) | B;
}
