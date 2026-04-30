import { Container, Graphics } from 'pixi.js';
import { Element, SpinnerElement } from '../../domain/models/element.model';

interface SpinnerSlot {
  readonly view: Container;
  readonly bar: Graphics;
  readonly hub: Graphics;
}

export class SpinnersRenderer {
  readonly view = new Container();
  private readonly slots = new Map<number, SpinnerSlot>();

  setElements(elements: readonly Element[]): void {
    this.slots.forEach(s => s.view.destroy({ children: true }));
    this.slots.clear();
    for (const el of elements) {
      if (el.type !== 'spinner') continue;
      this.slots.set(el.id, this.makeSlot(el));
    }
  }

  setAngles(map: Record<number, number>): void {
    this.slots.forEach((slot, id) => {
      const ang = map[id] ?? 0;
      slot.bar.rotation = ang;
    });
  }

  destroy(): void {
    this.slots.forEach(s => s.view.destroy({ children: true }));
    this.slots.clear();
    this.view.destroy({ children: true });
  }

  private makeSlot(el: SpinnerElement): SpinnerSlot {
    const view = new Container();
    view.position.set(el.cx, el.cy);
    const bar = new Graphics();
    const r = el.h * 0.5;
    bar.roundRect(-el.w / 2, -el.h / 2, el.w, el.h, r).fill({ color: 0xa855f7, alpha: 0.92 })
      .stroke({ width: 1, color: 0xd8b4fe, alpha: 0.6 });
    // ghost trail (motion blur)
    const ghost = new Graphics();
    ghost.roundRect(-el.w / 2, -el.h / 2, el.w, el.h, r).fill({ color: 0xa855f7, alpha: 0.28 });
    ghost.rotation = -0.3;
    bar.addChild(ghost);

    const hub = new Graphics();
    hub.circle(0, 0, el.h * 0.7).fill({ color: 0x4c1d95 })
      .stroke({ width: 1.4, color: 0xa855f7, alpha: 0.8 });

    view.addChild(bar, hub);
    this.view.addChild(view);
    return { view, bar, hub };
  }
}
