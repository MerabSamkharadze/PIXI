import { Container, Graphics } from 'pixi.js';
import { Element, GravityWellElement } from '../../domain/models/element.model';

interface FieldSlot {
  readonly view: Container;
  readonly rings: Graphics[];
  readonly mode: 'attract' | 'repel';
  spin: number;
}

export class GravityFieldsRenderer {
  readonly view = new Container();
  private readonly slots: FieldSlot[] = [];

  setElements(elements: readonly Element[]): void {
    this.slots.forEach(s => s.view.destroy({ children: true }));
    this.slots.length = 0;

    for (const el of elements) {
      if (el.type !== 'gravityWell') continue;
      this.slots.push(this.makeSlot(el));
    }
  }

  tick(deltaMs: number): void {
    for (const slot of this.slots) {
      slot.spin += deltaMs * 0.0006;
      slot.rings.forEach((ring, i) => {
        const pulse = Math.sin(slot.spin + i * 0.7);
        ring.alpha = 0.18 + 0.18 * (pulse * 0.5 + 0.5);
        ring.rotation = slot.spin * (slot.mode === 'attract' ? 1 : -1) * (i === 1 ? 0.7 : 1);
      });
    }
  }

  destroy(): void {
    this.slots.forEach(s => s.view.destroy({ children: true }));
    this.slots.length = 0;
    this.view.destroy({ children: true });
  }

  private makeSlot(el: GravityWellElement): FieldSlot {
    const view = new Container();
    view.position.set(el.x, el.y);
    const color = el.mode === 'attract' ? 0x22d3ee : 0xec4899;
    const rings: Graphics[] = [];
    for (let i = 0; i < 3; i++) {
      const r = el.r * (0.4 + i * 0.3);
      const ring = new Graphics();
      ring.circle(0, 0, r).stroke({ width: 1.4, color, alpha: 0.4 });
      // dashed ticks at cardinals
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const sx = Math.cos(a) * r;
        const sy = Math.sin(a) * r;
        ring.moveTo(sx, sy)
          .lineTo(sx * 0.9, sy * 0.9)
          .stroke({ width: 1, color, alpha: 0.6 });
      }
      view.addChild(ring);
      rings.push(ring);
    }
    // central glow
    const core = new Graphics();
    core.circle(0, 0, 8).fill({ color, alpha: 0.55 });
    view.addChild(core);
    this.view.addChild(view);
    return { view, rings, mode: el.mode, spin: Math.random() * Math.PI };
  }
}
