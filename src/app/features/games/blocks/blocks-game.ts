import { EffectRef, Injector, effect } from '@angular/core';
import { Container, Ticker } from 'pixi.js';
import { BasePixiGame } from '../../../core/game/base-pixi-game';
import { GameStateService } from './domain/state/game-state.service';
import { GameEngineService as BlocksRulesService } from './domain/services/game-engine.service';
import { ClearedCell } from './domain/state/game-state.service';
import {
  BlocksConfig,
  fieldPixelSize,
  pickBlocksConfig
} from './domain/models/blocks-config.model';
import { COLORS } from './domain/models/tetromino.model';
import { ArenaRenderer } from './pixi/renderers/arena.renderer';
import { PlayfieldRenderer } from './pixi/renderers/playfield.renderer';
import { ActivePieceRenderer } from './pixi/renderers/active-piece.renderer';
import { ParticleRenderer } from './pixi/renderers/particle.renderer';
import { FlashRenderer } from './pixi/renderers/flash.renderer';
import { ComboPopupRenderer } from './pixi/renderers/combo-popup.renderer';
import { KeyboardInput } from './pixi/input/keyboard-input';
import { TouchInput } from './pixi/input/touch-input';

const SHAKE_MS = 320;
const SHAKE_AMPLITUDE = 6;

const CLEAR_LABELS: Record<number, string> = {
  1: 'SINGLE',
  2: 'DOUBLE',
  3: 'TRIPLE',
  4: 'TETRIS!'
};

const CLEAR_COLORS: Record<number, number> = {
  1: 0xffffff,
  2: 0x22d3ee,
  3: 0xa855f7,
  4: 0xec4899
};

export class BlocksGame extends BasePixiGame {
  readonly id = 'blocks';

  private config: BlocksConfig;

  private playRoot: Container | null = null;
  private fieldLayer: Container | null = null;
  private arena: ArenaRenderer | null = null;
  private playfield: PlayfieldRenderer | null = null;
  private activePieceR: ActivePieceRenderer | null = null;
  private particles: ParticleRenderer | null = null;
  private flash: FlashRenderer | null = null;
  private comboPopup: ComboPopupRenderer | null = null;

  private ticker: Ticker | null = null;
  private keyboard: KeyboardInput | null = null;
  private touch: TouchInput | null = null;
  private effects: EffectRef[] = [];

  private shakeMs = 0;
  private shakeActive = false;
  private baseX = 0;
  private baseY = 0;
  private lastShakeId = 0;
  private lastClearId = 0;

  constructor(
    config: BlocksConfig,
    private readonly state: GameStateService,
    private readonly rules: BlocksRulesService,
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
    this.playfield = new PlayfieldRenderer(this.config);
    this.activePieceR = new ActivePieceRenderer(this.config);
    this.particles = new ParticleRenderer();
    this.flash = new FlashRenderer();
    this.comboPopup = new ComboPopupRenderer();

    const fieldLayer = new Container();
    fieldLayer.position.set(this.config.fieldPadding, this.config.fieldPadding);
    fieldLayer.addChild(
      this.playfield.view,
      this.activePieceR.view,
      this.particles.view,
      this.flash.view,
      this.comboPopup.view
    );

    const inner = {
      width: this.config.cols * this.config.cellSize,
      height: this.config.rows * this.config.cellSize
    };
    this.flash.setSize(inner.width, inner.height);

    const mask = this.arena.buildMask();
    playRoot.addChild(this.arena.view, mask, fieldLayer);
    fieldLayer.mask = mask;

    this.fieldLayer = fieldLayer;

    this.applyComboOrigin();
    this.particles.prewarm(40);
    this.center();

    this.keyboard = new KeyboardInput({
      onLeft: () => this.rules.moveLeft(),
      onRight: () => this.rules.moveRight(),
      onSoftDrop: a => this.rules.setSoftDrop(a),
      onHardDrop: () => this.rules.hardDrop(),
      onRotate: d => this.rules.rotate(d),
      onHold: () => this.rules.hold(),
      onPause: () => this.rules.togglePause()
    });

    this.touch = new TouchInput(
      this.ctx.app.canvas,
      {
        onLeft: () => this.rules.moveLeft(),
        onRight: () => this.rules.moveRight(),
        onSoftDrop: a => this.rules.setSoftDrop(a),
        onHardDrop: () => this.rules.hardDrop(),
        onRotate: d => this.rules.rotate(d),
        onHold: () => this.rules.hold()
      },
      this.config.cellSize
    );

    this.ticker = new Ticker();
    this.ticker.add(t => this.frame(t.deltaMS));
    this.ticker.start();

    this.rules.start(this.config);

    this.effects.push(effect(() => {
      const grid = this.state.grid();
      this.playfield?.syncGrid(grid);
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      const piece = this.state.activePiece();
      const grid = this.state.grid();
      this.activePieceR?.setPiece(piece, grid);
    }, { injector: this.injector }));

    this.effects.push(effect(() => {
      const clear = this.state.lastClear();
      if (clear.id === 0 || clear.id === this.lastClearId) return;
      this.lastClearId = clear.id;
      this.handleClearEffects(clear.lines, clear.combo, clear.isTetris, clear.cells);
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
    const next = pickBlocksConfig(window.innerWidth);
    if (next !== this.config) {
      this.config = next;
      this.arena?.setConfig(next);
      this.playfield?.setConfig(next);
      this.activePieceR?.setConfig(next);
      this.touch?.setCellSize(next.cellSize);
      const inner = {
        width: next.cols * next.cellSize,
        height: next.rows * next.cellSize
      };
      this.flash?.setSize(inner.width, inner.height);
      if (this.fieldLayer) {
        this.fieldLayer.position.set(next.fieldPadding, next.fieldPadding);
      }
      this.applyComboOrigin();
    }
    const size = fieldPixelSize(this.config);
    this.baseX = (width - size.width) / 2;
    this.baseY = (height - size.height) / 2;
    this.playRoot.position.set(this.baseX, this.baseY);
  }

  protected onDestroy(): void {
    this.effects.forEach(e => e.destroy());
    this.effects = [];
    this.ticker?.destroy();
    this.ticker = null;
    this.keyboard?.destroy();
    this.keyboard = null;
    this.touch?.destroy();
    this.touch = null;
    this.activePieceR?.destroy();
    this.playfield?.destroy();
    this.particles?.destroy();
    this.flash?.destroy();
    this.comboPopup?.destroy();
    this.arena?.destroy();
    this.activePieceR = null;
    this.playfield = null;
    this.particles = null;
    this.flash = null;
    this.comboPopup = null;
    this.arena = null;
    this.fieldLayer = null;
    this.playRoot = null;
  }

  private center(): void {
    if (!this.playRoot) return;
    const size = fieldPixelSize(this.config);
    this.baseX = (this.ctx.width - size.width) / 2;
    this.baseY = (this.ctx.height - size.height) / 2;
    this.playRoot.position.set(this.baseX, this.baseY);
  }

  private applyComboOrigin(): void {
    if (!this.comboPopup) return;
    const inner = {
      width: this.config.cols * this.config.cellSize,
      height: this.config.rows * this.config.cellSize
    };
    this.comboPopup.setOrigin(inner.width / 2, inner.height * 0.4);
  }

  private frame(deltaMs: number): void {
    if (this.state.isPlaying()) {
      this.rules.tick(deltaMs);
    }
    this.activePieceR?.tick(deltaMs);
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

  private handleClearEffects(
    lines: number,
    combo: number,
    isTetris: boolean,
    cells: readonly ClearedCell[]
  ): void {
    if (lines === 0) return;
    const label = CLEAR_LABELS[lines] ?? 'CLEAR';
    const color = CLEAR_COLORS[lines] ?? 0xffffff;
    this.comboPopup?.show(label, color, isTetris);
    if (combo >= 1) {
      this.comboPopup?.showCombo(`COMBO ×${combo + 1}`, 0xfbbf24);
    }

    const cellSize = this.config.cellSize;
    const hidden = this.config.hiddenRows;
    for (const cell of cells) {
      const px = cell.x * cellSize + cellSize / 2;
      const py = (cell.y - hidden) * cellSize + cellSize / 2;
      this.particles?.burst(px, py, COLORS[cell.type], 6);
    }
  }
}
