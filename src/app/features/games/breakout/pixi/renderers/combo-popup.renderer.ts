import { Container, Text } from 'pixi.js';

const LIFE_MS = 1000;
const RISE_PX = 60;

interface Slot {
  readonly label: Text;
  active: boolean;
  elapsed: number;
  originY: number;
  startScale: number;
}

export class ComboPopupRenderer {
  readonly view = new Container();
  private readonly main: Slot;
  private readonly secondary: Slot;

  constructor() {
    this.main = this.makeSlot(28);
    this.secondary = this.makeSlot(15);
    this.view.addChild(this.main.label, this.secondary.label);
  }

  show(text: string, color: number, big = false): void {
    this.fillSlot(this.main, text, color, big ? 36 : 26, big ? 1.4 : 1);
  }

  showSecondary(text: string, color: number): void {
    this.fillSlot(this.secondary, text, color, 15, 1);
  }

  setOrigin(x: number, y: number): void {
    this.main.label.position.set(x, y);
    this.main.originY = y;
    this.secondary.label.position.set(x, y + 36);
    this.secondary.originY = y + 36;
  }

  tick(deltaMs: number): void {
    this.tickSlot(this.main, deltaMs);
    this.tickSlot(this.secondary, deltaMs);
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private fillSlot(slot: Slot, text: string, color: number, fontSize: number, startScale: number): void {
    slot.label.text = text;
    slot.label.style.fill = color;
    slot.label.style.fontSize = fontSize;
    slot.label.alpha = 1;
    slot.label.visible = true;
    slot.startScale = startScale;
    slot.label.scale.set(startScale);
    slot.elapsed = 0;
    slot.active = true;
  }

  private tickSlot(slot: Slot, deltaMs: number): void {
    if (!slot.active) return;
    slot.elapsed += deltaMs;
    const t = slot.elapsed / LIFE_MS;
    if (t >= 1) {
      slot.active = false;
      slot.label.visible = false;
      return;
    }
    const ease = 1 - Math.pow(1 - t, 3);
    slot.label.position.y = slot.originY - RISE_PX * ease;
    slot.label.alpha = 1 - t;
    const scale = slot.startScale + (1 - slot.startScale) * Math.min(1, t * 3);
    slot.label.scale.set(scale);
  }

  private makeSlot(fontSize: number): Slot {
    const label = new Text({
      text: '',
      style: {
        fontFamily: 'Orbitron, "Inter", system-ui, sans-serif',
        fontWeight: '800',
        fontSize,
        fill: 0xffffff,
        align: 'center',
        letterSpacing: 4,
        dropShadow: {
          color: 0x000000,
          alpha: 0.7,
          blur: 8,
          angle: Math.PI / 4,
          distance: 2
        }
      }
    });
    label.anchor.set(0.5);
    label.visible = false;
    return { label, active: false, elapsed: 0, originY: 0, startScale: 1 };
  }
}
