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
  private readonly combo: Slot;

  constructor() {
    this.main = this.makeSlot(28);
    this.combo = this.makeSlot(16);
    this.view.addChild(this.main.label, this.combo.label);
  }

  show(text: string, color: number, big = false): void {
    const slot = this.main;
    slot.label.text = text;
    slot.label.style.fill = color;
    slot.label.style.fontSize = big ? 36 : 26;
    slot.label.alpha = 1;
    slot.label.visible = true;
    slot.startScale = big ? 1.4 : 1;
    slot.label.scale.set(slot.startScale);
    slot.elapsed = 0;
    slot.active = true;
  }

  showCombo(text: string, color: number): void {
    const slot = this.combo;
    slot.label.text = text;
    slot.label.style.fill = color;
    slot.label.alpha = 1;
    slot.label.visible = true;
    slot.startScale = 1;
    slot.label.scale.set(1);
    slot.elapsed = 0;
    slot.active = true;
  }

  setOrigin(x: number, y: number): void {
    this.main.label.position.set(x, y);
    this.main.originY = y;
    this.combo.label.position.set(x, y + 36);
    this.combo.originY = y + 36;
  }

  tick(deltaMs: number): void {
    this.tickSlot(this.main, deltaMs);
    this.tickSlot(this.combo, deltaMs);
  }

  destroy(): void {
    this.view.destroy({ children: true });
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
