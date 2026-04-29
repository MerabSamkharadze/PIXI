import { Container, Graphics } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { Cell, Direction } from '../../domain/models/snake.model';
import { SnakeConfig } from '../../domain/models/snake-config.model';

const HEAD_COLOR = 0xa3e635;
const BODY_COLOR = 0x65a30d;
const EYE_COLOR = 0x0b1020;
const SQUASH_MS = 220;
const DEATH_PER_SEGMENT_MS = 280;
const DEATH_STAGGER_MS = 35;

interface SegmentState {
  readonly g: Graphics;
  drawnSize: number;
  drawnIsHead: boolean;
  drawnDir: Direction | null;
  drawnSquash: number;
}

export class SnakeRenderer {
  readonly view = new Container();
  private readonly segments: SegmentState[] = [];
  private config: SnakeConfig;
  private squashStart = -Infinity;
  private dyingStart = -Infinity;

  constructor(config: SnakeConfig) {
    this.config = config;
    this.view.filters = [
      new GlowFilter({ distance: 14, outerStrength: 1.4, innerStrength: 0.2, color: 0xa3e635, quality: 0.3 })
    ];
  }

  setConfig(config: SnakeConfig): void {
    this.config = config;
    this.segments.forEach(s => s.g.destroy());
    this.segments.length = 0;
    this.dyingStart = -Infinity;
    this.squashStart = -Infinity;
  }

  squash(): void {
    this.squashStart = performance.now();
  }

  startDying(): void {
    this.dyingStart = performance.now();
  }

  isDying(): boolean {
    return Number.isFinite(this.dyingStart);
  }

  render(prev: readonly Cell[], curr: readonly Cell[], t: number, dir: Direction): void {
    this.ensurePool(curr.length);
    const { cellSize, boardPadding, cols, rows } = this.config;

    const sinceSquash = performance.now() - this.squashStart;
    const squashAmt = sinceSquash >= 0 && sinceSquash < SQUASH_MS
      ? Math.sin((sinceSquash / SQUASH_MS) * Math.PI) * 0.18
      : 0;

    for (let i = 0; i < curr.length; i++) {
      const fromRaw = i < prev.length ? prev[i] : prev[prev.length - 1] ?? curr[i];
      const to = curr[i];

      const wrappedX = Math.abs(to.x - fromRaw.x) > cols / 2;
      const wrappedY = Math.abs(to.y - fromRaw.y) > rows / 2;
      const useT = wrappedX || wrappedY ? 1 : t;

      const cellX = fromRaw.x + (to.x - fromRaw.x) * useT;
      const cellY = fromRaw.y + (to.y - fromRaw.y) * useT;
      const px = boardPadding + cellX * cellSize + cellSize / 2;
      const py = boardPadding + cellY * cellSize + cellSize / 2;

      const seg = this.segments[i];
      const g = seg.g;
      g.position.set(px, py);

      const isHead = i === 0;
      const taper = Math.max(0, 1 - i * 0.012);
      const baseSize = (cellSize - 4) * taper;
      const size = isHead ? baseSize * (1 + squashAmt) : baseSize;

      const needsRedraw =
        seg.drawnSize === -1 ||
        seg.drawnIsHead !== isHead ||
        (isHead
          ? seg.drawnSquash !== squashAmt || seg.drawnDir !== dir
          : seg.drawnSize !== size);

      if (!needsRedraw) continue;

      const radius = Math.min(8, size / 2.5);
      g.clear();
      g.roundRect(-size / 2, -size / 2, size, size, radius)
        .fill({ color: isHead ? HEAD_COLOR : BODY_COLOR });

      if (isHead) {
        const dirVec = directionVec(dir);
        const eyeOff = size * 0.22;
        const perpX = -dirVec.y;
        const perpY = dirVec.x;
        const eyeR = Math.max(1.5, size * 0.1);
        for (const sign of [-1, 1]) {
          const ex = dirVec.x * eyeOff * 0.5 + perpX * eyeOff * sign;
          const ey = dirVec.y * eyeOff * 0.5 + perpY * eyeOff * sign;
          g.circle(ex, ey, eyeR).fill({ color: EYE_COLOR });
        }
      }

      seg.drawnSize = size;
      seg.drawnIsHead = isHead;
      seg.drawnDir = isHead ? dir : null;
      seg.drawnSquash = isHead ? squashAmt : 0;
    }
  }

  tickDying(curr: readonly Cell[], _deltaMs: number): void {
    if (!this.isDying()) return;
    if (this.segments.length === 0) return;

    const elapsed = performance.now() - this.dyingStart;

    for (let i = 0; i < Math.min(this.segments.length, curr.length); i++) {
      const g = this.segments[i].g;
      const segDelay = i * DEATH_STAGGER_MS;
      const segT = Math.max(0, Math.min(1, (elapsed - segDelay) / DEATH_PER_SEGMENT_MS));

      g.scale.set(1 - segT);
      g.rotation = segT * Math.PI * 0.6;
      g.alpha = 1 - segT;
    }
  }

  destroy(): void {
    this.segments.length = 0;
    this.view.destroy({ children: true });
  }

  private ensurePool(n: number): void {
    while (this.segments.length < n) {
      const g = new Graphics();
      this.view.addChild(g);
      this.segments.push({
        g,
        drawnSize: -1,
        drawnIsHead: false,
        drawnDir: null,
        drawnSquash: 0
      });
    }
    while (this.segments.length > n) {
      const seg = this.segments.pop();
      seg?.g.destroy();
    }
  }
}

function directionVec(d: Direction): { x: number; y: number } {
  switch (d) {
    case 'up': return { x: 0, y: -1 };
    case 'down': return { x: 0, y: 1 };
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
  }
}
