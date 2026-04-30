import { Container, Text } from 'pixi.js';

const LIFE_MS = 950;
const RISE_PX = 50;

interface Slot {
  readonly label: Text;
  active: boolean;
  elapsed: number;
  originY: number;
  originX: number;
}

export class ComboPopupRenderer {
  readonly view = new Container();
  private readonly slot: Slot;

  constructor() {
    this.slot = this.makeSlot();
    this.view.addChild(this.slot.label);
  }

  show(text: string, color: number, x: number, y: number, big = false): void {
    const slot = this.slot;
    slot.label.text = text;
    slot.label.style.fill = color;
    slot.label.style.fontSize = big ? 30 : 22;
    slot.label.alpha = 1;
    slot.label.visible = true;
    slot.label.scale.set(big ? 1.3 : 1);
    slot.label.position.set(x, y);
    slot.originX = x;
    slot.originY = y;
    slot.elapsed = 0;
    slot.active = true;
  }

  tick(deltaMs: number): void {
    if (!this.slot.active) return;
    this.slot.elapsed += deltaMs;
    const t = this.slot.elapsed / LIFE_MS;
    if (t >= 1) {
      this.slot.active = false;
      this.slot.label.visible = false;
      return;
    }
    const ease = 1 - Math.pow(1 - t, 3);
    this.slot.label.position.y = this.slot.originY - RISE_PX * ease;
    this.slot.label.alpha = 1 - t;
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private makeSlot(): Slot {
    const label = new Text({
      text: '',
      style: {
        fontFamily: 'Orbitron, "Inter", system-ui, sans-serif',
        fontWeight: '800',
        fontSize: 22,
        fill: 0xffffff,
        align: 'center',
        letterSpacing: 3,
        dropShadow: {
          color: 0x000000,
          alpha: 0.7,
          blur: 6,
          angle: Math.PI / 4,
          distance: 2
        }
      }
    });
    label.anchor.set(0.5);
    label.visible = false;
    return { label, active: false, elapsed: 0, originX: 0, originY: 0 };
  }
}
