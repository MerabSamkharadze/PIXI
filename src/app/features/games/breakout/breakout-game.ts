import { EffectRef, Injector, effect } from '@angular/core';
import { Container, Ticker } from 'pixi.js';
import { BasePixiGame } from '../../../core/game/base-pixi-game';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as BreakoutRulesService } from './domain/services/game-engine.service';
import {
  BreakoutConfig,
  pickBreakoutConfig
} from './domain/models/breakout-config.model';
import { ArenaRenderer } from './pixi/renderers/arena.renderer';
import { BricksLayerRenderer } from './pixi/renderers/bricks-layer.renderer';
import { PaddleRenderer } from './pixi/renderers/paddle.renderer';
import { BallRenderer } from './pixi/renderers/ball.renderer';
import { PowerUpRenderer } from './pixi/renderers/powerup.renderer';
import { BulletRenderer } from './pixi/renderers/bullet.renderer';
import { ParticleRenderer } from './pixi/renderers/particle.renderer';
import { FlashRenderer } from './pixi/renderers/flash.renderer';
import { ComboPopupRenderer } from './pixi/renderers/combo-popup.renderer';
import { KeyboardInput } from './pixi/input/keyboard-input';
import { PointerInput } from './pixi/input/pointer-input';

const SHAKE_MS = 320;
const SHAKE_AMPLITUDE = 6;

export class BreakoutGame extends BasePixiGame {
  readonly id = 'breakout';

  private config: BreakoutConfig;

  private playRoot: Container | null = null;
  private fieldLayer: Container | null = null;
  private arena: ArenaRenderer | null = null;
  private bricksLayer: BricksLayerRenderer | null = null;
  private paddle: PaddleRenderer | null = null;
  private ballR: BallRenderer | null = null;
  private powerUps: PowerUpRenderer | null = null;
  private bullets: BulletRenderer | null = null;
  private particles: ParticleRenderer | null = null;
  private flash: FlashRenderer | null = null;
  private comboPopup: ComboPopupRenderer | null = null;

  private ticker: Ticker | null = null;
  private keyboard: KeyboardInput | null = null;
  private pointer: PointerInput | null = null;
  private effects: EffectRef[] = [];

  private shakeMs = 0;
  private shakeActive = false;
  private baseX = 0;
  private baseY = 0;
  private lastShakeId = 0;
  private lastEventId = 0;

  constructor(
    config: BreakoutConfig,
    private readonly state: GameStateService,
    private readonly rules: BreakoutRulesService,
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
    this.bricksLayer = new BricksLayerRenderer(this.config);
    this.paddle = new PaddleRenderer(this.config);
    this.ballR = new BallRenderer(this.config);
    this.powerUps = new PowerUpRenderer();
    this.bullets = new BulletRenderer();
    this.particles = new ParticleRenderer();
    this.flash = new FlashRenderer();
    this.comboPopup = new ComboPopupRenderer();

    const fieldLayer = new Container();
    fieldLayer.addChild(
      this.bricksLayer.view,
      this.paddle.view,
      this.ballR.view,
      this.powerUps.view,
      this.bullets.view,
      this.particles.view,
      this.flash.view,
      this.comboPopup.view
    );

    const inner = {
      width: this.config.fieldWidth - this.config.fieldPadding * 2,
      height: this.config.fieldHeight - this.config.fieldPadding * 2
    };
    this.flash.setSize(inner.width, inner.height);
    this.flash.view.position.set(this.config.fieldPadding, this.config.fieldPadding);

    this.applyComboOrigin();

    playRoot.addChild(this.arena.view, fieldLayer);
    this.fieldLayer = fieldLayer;

    this.particles.prewarm(60);
    this.center();

    this.keyboard = new KeyboardInput({
      onDir: dir => this.rules.setKeyboardDir(dir),
      onPress: () => { this.rules.launchBalls(); this.rules.fire(); },
      onPause: () => this.rules.togglePause()
    });

    this.pointer = new PointerInput(this.ctx.app.canvas, {
      onMove: x => this.rules.setPaddleX(x),
      onPress: () => { this.rules.launchBalls(); this.rules.fire(); }
    });

    this.ticker = new Ticker();
    this.ticker.add(t => this.frame(t.deltaMS));
    this.ticker.start();

    this.rules.start(this.config);

    this.effects.push(effect(() => {
      const bricks = this.state.bricks();
      this.bricksLayer?.syncBricks(bricks);
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      const paddle = this.state.paddle();
      const config = this.config;
      const paddleY = config.fieldHeight - config.paddleY - config.paddleHeight;
      this.paddle?.setPaddle(paddle, paddleY);
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      this.paddle?.setLaserActive(this.state.laserActive());
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      const balls = this.state.balls();
      this.ballR?.syncBalls(balls);
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      this.powerUps?.syncPowerUps(this.state.powerUps());
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      this.bullets?.syncBullets(this.state.bullets());
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      const event = this.state.lastEvent();
      if (event.id === 0 || event.id === this.lastEventId) return;
      this.lastEventId = event.id;
      this.handleEvent(event);
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      const id = this.state.shakeId();
      if (id === 0 || id === this.lastShakeId) return;
      this.lastShakeId = id;
      this.shakeMs = SHAKE_MS;
      this.flash?.trigger();
    }, { injector: this.injector }));
  }

  resize(width: number, height: number): void {
    if (!this.playRoot) return;
    const next = pickBreakoutConfig(window.innerWidth);
    if (next !== this.config) {
      this.config = next;
      this.arena?.setConfig(next);
      this.bricksLayer?.setConfig(next);
      this.paddle?.setConfig(next);
      this.ballR?.setConfig(next);
      const inner = {
        width: next.fieldWidth - next.fieldPadding * 2,
        height: next.fieldHeight - next.fieldPadding * 2
      };
      this.flash?.setSize(inner.width, inner.height);
      this.flash?.view.position.set(next.fieldPadding, next.fieldPadding);
      this.applyComboOrigin();
    }
    this.baseX = (width - this.config.fieldWidth) / 2;
    this.baseY = (height - this.config.fieldHeight) / 2;
    this.playRoot.position.set(this.baseX, this.baseY);
  }

  protected onDestroy(): void {
    this.effects.forEach(e => e.destroy());
    this.effects = [];
    this.ticker?.destroy();
    this.ticker = null;
    this.keyboard?.destroy();
    this.keyboard = null;
    this.pointer?.destroy();
    this.pointer = null;
    this.bricksLayer?.destroy();
    this.paddle?.destroy();
    this.ballR?.destroy();
    this.powerUps?.destroy();
    this.bullets?.destroy();
    this.particles?.destroy();
    this.flash?.destroy();
    this.comboPopup?.destroy();
    this.arena?.destroy();
    this.bricksLayer = null;
    this.paddle = null;
    this.ballR = null;
    this.powerUps = null;
    this.bullets = null;
    this.particles = null;
    this.flash = null;
    this.comboPopup = null;
    this.arena = null;
    this.fieldLayer = null;
    this.playRoot = null;
  }

  private center(): void {
    if (!this.playRoot) return;
    this.baseX = (this.ctx.width - this.config.fieldWidth) / 2;
    this.baseY = (this.ctx.height - this.config.fieldHeight) / 2;
    this.playRoot.position.set(this.baseX, this.baseY);
  }

  private applyComboOrigin(): void {
    if (!this.comboPopup) return;
    this.comboPopup.setOrigin(this.config.fieldWidth / 2, this.config.fieldHeight * 0.4);
  }

  private frame(deltaMs: number): void {
    if (this.state.isPlaying()) this.rules.tick(deltaMs);
    this.paddle?.tick(deltaMs);
    this.powerUps?.tick(deltaMs);
    this.particles?.tick(deltaMs);
    this.flash?.tick(deltaMs);
    this.comboPopup?.tick(deltaMs);

    if (this.shakeMs > 0 && this.playRoot) {
      this.shakeMs = Math.max(0, this.shakeMs - deltaMs);
      const intensity = (this.shakeMs / SHAKE_MS) * SHAKE_AMPLITUDE;
      const sx = (Math.random() * 2 - 1) * intensity;
      const sy = (Math.random() * 2 - 1) * intensity;
      this.playRoot.position.set(this.baseX + sx, this.baseY + sy);
      this.shakeActive = true;
    } else if (this.shakeActive && this.playRoot) {
      this.playRoot.position.set(this.baseX, this.baseY);
      this.shakeActive = false;
    }
  }

  private handleEvent(event: ReturnType<GameStateService['lastEvent']>): void {
    switch (event.kind) {
      case 'brickBreak':
        if (event.x !== undefined && event.y !== undefined) {
          this.particles?.burst(event.x, event.y, event.color ?? 0xffffff, 8);
        }
        if ((event.combo ?? 0) >= 3) {
          this.comboPopup?.showSecondary(`COMBO ×${event.combo}`, 0xfbbf24);
        }
        break;
      case 'brickCrack':
        if (event.x !== undefined && event.y !== undefined) {
          this.particles?.burst(event.x, event.y, event.color ?? 0xffffff, 4);
        }
        break;
      case 'powerUpCaught':
        this.comboPopup?.show(event.text ?? 'POWER', 0x22d3ee, false);
        break;
      case 'multiBall':
        this.comboPopup?.show('MULTIBALL', 0xf59e0b, true);
        break;
      case 'levelComplete':
        this.comboPopup?.show(event.text ?? 'LEVEL UP', 0xec4899, true);
        break;
      case 'lifeLost':
        // shake & flash already handled via shakeId effect
        break;
    }
  }
}
