import { Container, Graphics, Text } from 'pixi.js';
import { Card, CardState } from '../../domain/models/card.model';

const FACE_COLOR = 0x18223a;
const FACE_STROKE = 0x4a6cf7;
const BACK_COLOR = 0x0b1020;
const BACK_STROKE = 0x2a3358;
const MATCHED_GLOW = 0x49e0a0;

export class CardRenderer {
  readonly view = new Container();
  private readonly back = new Graphics();
  private readonly face = new Graphics();
  private readonly label: Text;
  private flipProgress = 0;
  private currentState: CardState = 'hidden';
  private size: number;

  constructor(
    readonly card: Card,
    size: number,
    private readonly onClick: (id: number) => void
  ) {
    this.size = size;
    this.view.eventMode = 'static';
    this.view.cursor = 'pointer';
    this.view.pivot.set(size / 2, size / 2);
    this.view.on('pointertap', () => this.onClick(this.card.id));
    this.view.on('pointerover', () => this.hover(true));
    this.view.on('pointerout', () => this.hover(false));

    this.label = new Text({
      text: card.assetKey,
      style: {
        fontFamily: [
          '"Segoe UI Emoji"',
          '"Apple Color Emoji"',
          '"Noto Color Emoji"',
          'system-ui',
          'sans-serif'
        ],
        fontSize: size * 0.6,
        fill: 0xffffff,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          alpha: 0.55,
          blur: 6,
          angle: Math.PI / 4,
          distance: 3
        }
      }
    });
    this.label.anchor.set(0.5);
    this.label.position.set(size / 2, size / 2);
    this.label.alpha = 0;

    this.view.addChild(this.back, this.face, this.label);
    this.draw();
  }

  setSize(size: number): void {
    if (size === this.size) return;
    this.size = size;
    this.view.pivot.set(size / 2, size / 2);
    this.label.style.fontSize = size * 0.6;
    this.label.position.set(size / 2, size / 2);
    this.draw();
  }

  setState(state: CardState): void {
    if (state === this.currentState) return;
    this.currentState = state;
    this.draw();
  }

  setPosition(x: number, y: number): void {
    // pivot is centered, so the slot's top-left maps to (x + size/2, y + size/2)
    this.view.position.set(x + this.size / 2, y + this.size / 2);
  }

  /** called from the ticker; progress 0..1 toward target visibility */
  tick(deltaMs: number): void {
    const target = this.currentState === 'hidden' ? 0 : 1;
    const speed = 0.008;
    const next = this.flipProgress + Math.sign(target - this.flipProgress) * speed * deltaMs;
    this.flipProgress = clamp01(
      Math.abs(target - this.flipProgress) <= speed * deltaMs ? target : next
    );
    const scaleX = Math.abs(Math.cos(this.flipProgress * Math.PI));
    this.face.visible = this.flipProgress > 0.5;
    this.back.visible = this.flipProgress <= 0.5;
    this.label.alpha = this.flipProgress > 0.5 ? (this.flipProgress - 0.5) * 2 : 0;
    this.view.scale.x = Math.max(scaleX, 0.02);
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private draw(): void {
    const r = 16;
    const s = this.size;

    this.back.clear();
    this.back
      .roundRect(0, 0, s, s, r)
      .fill(BACK_COLOR)
      .stroke({ width: 2, color: BACK_STROKE });
    this.back
      .moveTo(s * 0.25, s * 0.25)
      .lineTo(s * 0.75, s * 0.75)
      .moveTo(s * 0.75, s * 0.25)
      .lineTo(s * 0.25, s * 0.75)
      .stroke({ width: 2, color: BACK_STROKE, alpha: 0.4 });

    this.face.clear();
    const stroke = this.currentState === 'matched' ? MATCHED_GLOW : FACE_STROKE;
    this.face
      .roundRect(0, 0, s, s, r)
      .fill(FACE_COLOR)
      .stroke({ width: 3, color: stroke });
  }

  private hover(active: boolean): void {
    if (this.currentState !== 'hidden') return;
    this.view.scale.y = active ? 1.04 : 1;
  }
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
