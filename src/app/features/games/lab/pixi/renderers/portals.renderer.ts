import { Container, Graphics } from 'pixi.js';
import { Element, PortalElement } from '../../domain/models/element.model';

interface PortalSlot {
  readonly view: Container;
  readonly outer: Graphics;
  readonly inner: Graphics;
  readonly color: number;
  spin: number;
  flash: number;
}

export class PortalsRenderer {
  readonly view = new Container();
  private readonly linkLayer = new Container();
  private readonly portalLayer = new Container();
  private readonly slots = new Map<number, PortalSlot>();
  private pairs: Array<{ a: PortalElement; b: PortalElement; line: Graphics }> = [];

  constructor() {
    this.view.addChild(this.linkLayer, this.portalLayer);
  }

  setElements(elements: readonly Element[]): void {
    this.slots.forEach(s => s.view.destroy({ children: true }));
    this.slots.clear();
    this.pairs.forEach(p => p.line.destroy());
    this.pairs = [];
    this.linkLayer.removeChildren().forEach(c => c.destroy());

    const portals = elements.filter((e): e is PortalElement => e.type === 'portal');
    for (const p of portals) {
      this.slots.set(p.id, this.makeSlot(p));
    }
    // Build pairs (each pair only once)
    const seen = new Set<number>();
    for (const p of portals) {
      if (seen.has(p.id)) continue;
      const partner = portals.find(q => q.id === p.pairId);
      if (!partner) continue;
      seen.add(p.id);
      seen.add(partner.id);
      const line = new Graphics();
      this.linkLayer.addChild(line);
      this.pairs.push({ a: p, b: partner, line });
    }
    this.redrawLinks();
  }

  flashPortal(id: number): void {
    const slot = this.slots.get(id);
    if (slot) slot.flash = 220;
  }

  tick(deltaMs: number): void {
    this.slots.forEach(slot => {
      slot.spin = (slot.spin + deltaMs * 0.0025) % (Math.PI * 2);
      slot.inner.rotation = slot.spin;
      if (slot.flash > 0) {
        slot.flash = Math.max(0, slot.flash - deltaMs);
        const t = 1 - slot.flash / 220;
        slot.outer.alpha = 0.6 + 0.4 * Math.sin(Math.PI * t);
      } else {
        slot.outer.alpha = 0.85;
      }
    });
  }

  destroy(): void {
    this.slots.forEach(s => s.view.destroy({ children: true }));
    this.slots.clear();
    this.pairs.forEach(p => p.line.destroy());
    this.pairs = [];
    this.view.destroy({ children: true });
  }

  private makeSlot(p: PortalElement): PortalSlot {
    const view = new Container();
    view.position.set(p.x, p.y);
    const outer = new Graphics();
    outer.circle(0, 0, p.r).fill({ color: 0x020617, alpha: 0.6 })
      .stroke({ width: 2.5, color: p.color, alpha: 1 });
    outer.circle(0, 0, p.r - 4).stroke({ width: 1, color: p.color, alpha: 0.4 });
    const inner = new Graphics();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const ix = Math.cos(a) * (p.r - 6);
      const iy = Math.sin(a) * (p.r - 6);
      inner.circle(ix, iy, 1.5).fill({ color: p.color, alpha: 0.9 });
    }
    view.addChild(outer, inner);
    this.portalLayer.addChild(view);
    return { view, outer, inner, color: p.color, spin: 0, flash: 0 };
  }

  private redrawLinks(): void {
    for (const pair of this.pairs) {
      pair.line.clear();
      pair.line
        .moveTo(pair.a.x, pair.a.y)
        .lineTo(pair.b.x, pair.b.y)
        .stroke({ width: 1, color: pair.a.color, alpha: 0.18 });
    }
  }
}
