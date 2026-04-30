import { EffectRef, Injector, effect } from '@angular/core';
import { Container, Ticker } from 'pixi.js';
import { BasePixiGame } from '../../../core/game/base-pixi-game';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as LabRulesService } from './domain/services/game-engine.service';
import { LabConfig, pickLabConfig } from './domain/models/lab-config.model';
import { ArenaRenderer } from './pixi/renderers/arena.renderer';
import { ElementsRenderer } from './pixi/renderers/elements.renderer';
import { SpinnersRenderer } from './pixi/renderers/spinners.renderer';
import { PortalsRenderer } from './pixi/renderers/portals.renderer';
import { GravityFieldsRenderer } from './pixi/renderers/gravity-fields.renderer';
import { BallsRenderer } from './pixi/renderers/balls.renderer';
import { AimLineRenderer } from './pixi/renderers/aim-line.renderer';
import { ParticleRenderer } from './pixi/renderers/particle.renderer';
import { FlashRenderer } from './pixi/renderers/flash.renderer';
import { ComboPopupRenderer } from './pixi/renderers/combo-popup.renderer';
import { KeyboardInput } from './pixi/input/keyboard-input';
import { PointerInput } from './pixi/input/pointer-input';

const EVENT_COLORS = {
  peg: 0x94a3b8,
  bumper: 0x22d3ee,
  wall: 0x4a6cf7,
  goal: 0xa3e635,
  portal: 0x22d3ee,
  spinner: 0xa855f7
} as const;

export class LabGame extends BasePixiGame {
  readonly id = 'lab';

  private config: LabConfig;
  private playRoot: Container | null = null;
  private fieldLayer: Container | null = null;

  private arena: ArenaRenderer | null = null;
  private gravityFields: GravityFieldsRenderer | null = null;
  private elementsR: ElementsRenderer | null = null;
  private spinners: SpinnersRenderer | null = null;
  private portals: PortalsRenderer | null = null;
  private balls: BallsRenderer | null = null;
  private aimLine: AimLineRenderer | null = null;
  private particles: ParticleRenderer | null = null;
  private flash: FlashRenderer | null = null;
  private comboPopup: ComboPopupRenderer | null = null;

  private ticker: Ticker | null = null;
  private keyboard: KeyboardInput | null = null;
  private pointer: PointerInput | null = null;
  private effects: EffectRef[] = [];
  private lastEventId = 0;

  constructor(
    config: LabConfig,
    private readonly state: GameStateService,
    private readonly rules: LabRulesService,
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
    this.gravityFields = new GravityFieldsRenderer();
    this.elementsR = new ElementsRenderer();
    this.spinners = new SpinnersRenderer();
    this.portals = new PortalsRenderer();
    this.balls = new BallsRenderer(this.config);
    this.aimLine = new AimLineRenderer(this.config);
    this.particles = new ParticleRenderer();
    this.flash = new FlashRenderer();
    this.comboPopup = new ComboPopupRenderer();

    const fieldLayer = new Container();
    fieldLayer.addChild(
      this.gravityFields.view,
      this.elementsR.view,
      this.spinners.view,
      this.portals.view,
      this.aimLine.view,
      this.balls.view,
      this.particles.view,
      this.flash.view,
      this.comboPopup.view
    );
    this.flash.setSize(
      this.config.fieldWidth - this.config.fieldPadding * 2,
      this.config.fieldHeight - this.config.fieldPadding * 2
    );
    this.flash.view.position.set(this.config.fieldPadding, this.config.fieldPadding);

    playRoot.addChild(this.arena.view, fieldLayer);
    this.fieldLayer = fieldLayer;

    this.particles.prewarm(80);
    this.center();

    this.keyboard = new KeyboardInput({
      onPress: () => this.rules.launch(),
      onPause: () => this.rules.togglePause(),
      onRetry: () => this.rules.retry(),
      onNext: () => {
        if (this.state.isLevelComplete()) this.rules.next();
      }
    });
    this.pointer = new PointerInput(this.ctx.app.canvas, {
      onMove: (x, y) => this.rules.setAim(x, y),
      onPress: () => this.rules.launch()
    });

    this.ticker = new Ticker();
    this.ticker.add(t => this.frame(t.deltaMS));
    this.ticker.start();

    this.rules.start(this.config);

    this.effects.push(effect(() => {
      const elements = this.state.elements();
      this.elementsR?.setElements(elements);
      this.spinners?.setElements(elements);
      this.portals?.setElements(elements);
      this.gravityFields?.setElements(elements);
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      this.aimLine?.setSpawner(this.state.spawner());
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      this.aimLine?.setAim(this.state.aim());
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      this.aimLine?.setActive(this.state.isPlaying() && this.state.ballsRemaining() > 0);
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      this.balls?.syncBalls(this.state.balls());
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      this.spinners?.setAngles(this.state.spinnerAngles());
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      const event = this.state.lastEvent();
      if (event.id === 0 || event.id === this.lastEventId) return;
      this.lastEventId = event.id;
      this.handleEvent(event);
    }, { injector: this.injector }));
  }

  resize(width: number, height: number): void {
    if (!this.playRoot) return;
    const next = pickLabConfig(window.innerWidth);
    if (next !== this.config) {
      this.config = next;
      this.arena?.setConfig(next);
      this.balls?.setConfig(next);
      this.aimLine?.setConfig(next);
      this.flash?.setSize(next.fieldWidth - next.fieldPadding * 2, next.fieldHeight - next.fieldPadding * 2);
      this.flash?.view.position.set(next.fieldPadding, next.fieldPadding);
    }
    const baseX = (width - this.config.fieldWidth) / 2;
    const baseY = (height - this.config.fieldHeight) / 2;
    this.playRoot.position.set(baseX, baseY);
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
    this.balls?.destroy();
    this.aimLine?.destroy();
    this.particles?.destroy();
    this.flash?.destroy();
    this.comboPopup?.destroy();
    this.elementsR?.destroy();
    this.spinners?.destroy();
    this.portals?.destroy();
    this.gravityFields?.destroy();
    this.arena?.destroy();
    this.balls = null;
    this.aimLine = null;
    this.particles = null;
    this.flash = null;
    this.comboPopup = null;
    this.elementsR = null;
    this.spinners = null;
    this.portals = null;
    this.gravityFields = null;
    this.arena = null;
    this.fieldLayer = null;
    this.playRoot = null;
  }

  private center(): void {
    if (!this.playRoot) return;
    const baseX = (this.ctx.width - this.config.fieldWidth) / 2;
    const baseY = (this.ctx.height - this.config.fieldHeight) / 2;
    this.playRoot.position.set(baseX, baseY);
  }

  private frame(deltaMs: number): void {
    if (this.state.isPlaying()) this.rules.tick(deltaMs);
    this.elementsR?.tick(deltaMs);
    this.portals?.tick(deltaMs);
    this.gravityFields?.tick(deltaMs);
    this.aimLine?.tick(deltaMs);
    this.particles?.tick(deltaMs);
    this.flash?.tick(deltaMs);
    this.comboPopup?.tick(deltaMs);
  }

  private handleEvent(event: ReturnType<GameStateService['lastEvent']>): void {
    if (event.kind === 'peg' || event.kind === 'wall' || event.kind === 'spinner') {
      if (event.x !== undefined && event.y !== undefined) {
        this.particles?.burst(event.x, event.y, event.color ?? EVENT_COLORS[event.kind] ?? 0xffffff, 4);
      }
      return;
    }
    if (event.kind === 'bumper') {
      if (event.x !== undefined && event.y !== undefined) {
        this.particles?.burst(event.x, event.y, event.color ?? EVENT_COLORS.bumper, 8);
        // also fire the bumper renderer flash if we can find element id (skip for now — visual is enough)
      }
      return;
    }
    if (event.kind === 'portal') {
      if (event.x !== undefined && event.y !== undefined) {
        this.particles?.burst(event.x, event.y, event.color ?? EVENT_COLORS.portal, 10);
      }
      return;
    }
    if (event.kind === 'goal') {
      if (event.x !== undefined && event.y !== undefined) {
        this.particles?.burst(event.x, event.y, event.color ?? EVENT_COLORS.goal, 14);
        this.comboPopup?.show(event.text ?? 'GOAL!', event.color ?? EVENT_COLORS.goal, event.x, event.y - 30, false);
      }
      return;
    }
    if (event.kind === 'levelComplete') {
      this.flash?.trigger(0x22d3ee);
      this.comboPopup?.show(`LAB ${this.state.levelIndex() + 1} CLEAR`,
        0x22d3ee, this.config.fieldWidth / 2, this.config.fieldHeight * 0.4, true);
      return;
    }
    if (event.kind === 'levelFailed') {
      this.flash?.trigger(0xec4899);
      return;
    }
  }
}
