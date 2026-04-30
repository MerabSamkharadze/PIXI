import { Injectable, inject } from '@angular/core';
import { ClearedCell, GameStateService } from '../state/game-state.service';
import { BlocksConfig } from '../models/blocks-config.model';
import { Grid, Piece } from '../models/playfield.model';
import { BOX, RotDirection, TetrominoType } from '../models/tetromino.model';
import {
  canPlace,
  dropDistance,
  lockPieceIntoGrid,
  tryRotate
} from './rotation-system';
import {
  clearAndCollapse,
  comboScore,
  detectFullLines,
  scoreFor
} from './line-clearer';
import { TetrominoBag } from './tetromino-bag';

@Injectable()
export class GameEngineService {
  private readonly state = inject(GameStateService);
  private readonly bag = new TetrominoBag();

  private gravityAccum = 0;
  private lockDelayElapsed = 0;
  private lockResets = 0;
  private touchingFloor = false;
  private softDropping = false;

  start(config: BlocksConfig): void {
    this.bag.reset();
    this.state.init(config);
    this.gravityAccum = 0;
    this.lockDelayElapsed = 0;
    this.lockResets = 0;
    this.touchingFloor = false;
    this.softDropping = false;
    this.refreshNextQueue();
    this.spawn();
  }

  tick(deltaMs: number): void {
    if (!this.state.isPlaying()) return;
    const piece = this.state.activePiece();
    if (!piece) return;

    const grid = this.state.grid();
    const canDrop = canPlace({ ...piece, y: piece.y + 1 }, grid);
    const gravityMs = this.softDropping
      ? Math.min(this.state.gravityMs(), this.state.config()?.softDropMs ?? 50)
      : this.state.gravityMs();

    if (canDrop) {
      this.touchingFloor = false;
      this.lockDelayElapsed = 0;
      this.gravityAccum += deltaMs;
      while (this.gravityAccum >= gravityMs) {
        this.gravityAccum -= gravityMs;
        const next = this.state.activePiece();
        if (!next) return;
        if (canPlace({ ...next, y: next.y + 1 }, this.state.grid())) {
          this.state.setActivePiece({ ...next, y: next.y + 1 });
          if (this.softDropping) this.state.addScore(1);
        } else {
          this.touchingFloor = true;
          break;
        }
      }
    } else {
      this.touchingFloor = true;
      this.gravityAccum = 0;
      this.lockDelayElapsed += deltaMs;
      const lockMs = this.state.config()?.lockDelayMs ?? 500;
      if (this.lockDelayElapsed >= lockMs) {
        this.lock();
      }
    }
  }

  moveLeft(): void {
    if (!this.state.isPlaying()) return;
    if (this.tryShift(-1, 0)) this.onSuccessfulNudge();
  }

  moveRight(): void {
    if (!this.state.isPlaying()) return;
    if (this.tryShift(1, 0)) this.onSuccessfulNudge();
  }

  setSoftDrop(active: boolean): void {
    this.softDropping = active;
  }

  hardDrop(): void {
    if (!this.state.isPlaying()) return;
    const piece = this.state.activePiece();
    if (!piece) return;
    const dy = dropDistance(piece, this.state.grid());
    if (dy > 0) {
      this.state.setActivePiece({ ...piece, y: piece.y + dy });
      this.state.addScore(dy * 2);
    }
    this.lock();
  }

  rotate(direction: RotDirection): void {
    if (!this.state.isPlaying()) return;
    const piece = this.state.activePiece();
    if (!piece) return;
    const rotated = tryRotate(piece, direction, this.state.grid());
    if (rotated) {
      this.state.setActivePiece(rotated);
      this.onSuccessfulNudge();
    }
  }

  hold(): void {
    if (!this.state.isPlaying()) return;
    if (this.state.holdLocked()) return;
    const piece = this.state.activePiece();
    if (!piece) return;
    const holdType = this.state.hold();

    this.state.setHold(piece.type, true);
    if (holdType === null) {
      this.spawn();
    } else {
      this.spawnSpecific(holdType);
    }
    this.state.setHoldLocked(true);
    this.gravityAccum = 0;
    this.lockDelayElapsed = 0;
    this.lockResets = 0;
    this.touchingFloor = false;
  }

  togglePause(): void {
    if (this.state.isPlaying()) this.state.setStatus('paused');
    else if (this.state.isPaused()) this.state.setStatus('playing');
  }

  // ------------------------------------------------------------------------

  private tryShift(dx: number, dy: number): boolean {
    const piece = this.state.activePiece();
    if (!piece) return false;
    const next: Piece = { ...piece, x: piece.x + dx, y: piece.y + dy };
    if (!canPlace(next, this.state.grid())) return false;
    this.state.setActivePiece(next);
    return true;
  }

  private onSuccessfulNudge(): void {
    if (!this.touchingFloor) return;
    const cap = this.state.config()?.lockResetCap ?? 15;
    if (this.lockResets >= cap) return;
    this.lockResets++;
    this.lockDelayElapsed = 0;
  }

  private lock(): void {
    const piece = this.state.activePiece();
    if (!piece) return;
    const cfg = this.state.config();
    if (!cfg) return;

    const next = lockPieceIntoGrid(piece, this.state.grid());
    const lines = detectFullLines(next);
    let finalGrid: Grid = next;

    if (lines.length > 0) {
      const clearedCells: ClearedCell[] = [];
      for (const y of lines) {
        const row = next[y];
        for (let x = 0; x < row.length; x++) {
          const t = row[x];
          if (t) clearedCells.push({ x, y, type: t });
        }
      }
      finalGrid = clearAndCollapse(next, lines);
      const level = this.state.level();
      const newCombo = this.state.combo() + 1;
      this.state.setCombo(newCombo);
      this.state.addScore(scoreFor(lines.length, level));
      if (newCombo > 0) this.state.addScore(comboScore(newCombo, level));
      this.state.addLines(lines.length);
      this.state.flagClear(lines.length, newCombo, clearedCells);
      if (lines.length === 4) this.state.triggerShake();
    } else {
      this.state.setCombo(-1);
    }

    this.state.setGrid(finalGrid);
    this.state.setActivePiece(null);
    this.state.setHoldLocked(false);
    this.gravityAccum = 0;
    this.lockDelayElapsed = 0;
    this.lockResets = 0;
    this.touchingFloor = false;

    this.spawn();
  }

  private refreshNextQueue(): void {
    const cfg = this.state.config();
    const n = cfg?.nextQueueSize ?? 3;
    this.state.setNextQueue(this.bag.peek(n));
  }

  private spawn(): void {
    const type = this.bag.next();
    this.spawnSpecific(type);
    this.refreshNextQueue();
  }

  private spawnSpecific(type: TetrominoType): void {
    const cfg = this.state.config();
    if (!cfg) return;
    const box = BOX[type];
    const piece: Piece = {
      type,
      rotation: 0,
      x: Math.floor((cfg.cols - box) / 2),
      y: 0
    };
    if (!canPlace(piece, this.state.grid())) {
      this.state.setActivePiece(piece);
      this.state.setStatus('lost');
      return;
    }
    this.state.setActivePiece(piece);
  }
}

