import { Container, Graphics, Text } from 'pixi.js';
import { POWERUP_COLORS, POWERUP_LABELS, PowerUpType } from '../../domain/models/brick.model';
import { PowerUp } from '../../domain/models/playfield.model';

interface Slot {
  readonly view: Container;
  readonly bg: Graphics;
  readonly label: Text;
  drawnType: PowerUpType | null;
  pulse: number;
}

const SIZE = 22;

export class PowerUpRenderer {
  readonly view = new Container();
  private readonly slots = new Map<number, Slot>();

  syncPowerUps(items: readonly PowerUp[]): void {
    const seen = new Set<number>();
    for (const pu of items) {
      seen.add(pu.id);
      let slot = this.slots.get(pu.id);
      if (!slot) {
        slot = this.makeSlot(pu.type);
        this.slots.set(pu.id, slot);
        this.view.addChild(slot.view);
      } else if (slot.drawnType !== pu.type) {
        this.drawSlot(slot, pu.type);
      }
      slot.view.position.set(pu.pos.x, pu.pos.y);
    }
    this.slots.forEach((slot, id) => {
      if (!seen.has(id)) {
        slot.view.destroy({ children: true });
        this.slots.delete(id);
      }
    });
  }

  tick(deltaMs: number): void {
    this.slots.forEach(slot => {
      slot.pulse = (slot.pulse + deltaMs * 0.005) % (Math.PI * 2);
      slot.view.scale.set(1 + Math.sin(slot.pulse) * 0.06);
    });
  }

  destroy(): void {
    this.slots.forEach(slot => slot.view.destroy({ children: true }));
    this.slots.clear();
    this.view.destroy({ children: true });
  }

  private makeSlot(type: PowerUpType): Slot {
    const view = new Container();
    const bg = new Graphics();
    const label = new Text({
      text: POWERUP_LABELS[type],
      style: {
        fontFamily: 'Orbitron, "Inter", system-ui, sans-serif',
        fontWeight: '800',
        fontSize: 12,
        fill: 0x020617,
        align: 'center'
      }
    });
    label.anchor.set(0.5);
    label.position.set(0, 0);
    view.addChild(bg, label);
    const slot: Slot = { view, bg, label, drawnType: null, pulse: Math.random() * Math.PI * 2 };
    this.drawSlot(slot, type);
    return slot;
  }

  private drawSlot(slot: Slot, type: PowerUpType): void {
    const color = POWERUP_COLORS[type];
    slot.bg.clear();
    slot.bg
      .roundRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE, 6)
      .fill({ color, alpha: 0.95 })
      .stroke({ width: 1.4, color: 0xffffff, alpha: 0.55 });
    slot.label.text = POWERUP_LABELS[type];
    slot.drawnType = type;
  }
}
