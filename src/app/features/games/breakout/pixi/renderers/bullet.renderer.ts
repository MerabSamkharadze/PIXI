import { Container, Graphics } from 'pixi.js';
import { Bullet } from '../../domain/models/playfield.model';

interface Slot {
  readonly g: Graphics;
}

export class BulletRenderer {
  readonly view = new Container();
  private readonly slots = new Map<number, Slot>();

  syncBullets(bullets: readonly Bullet[]): void {
    const seen = new Set<number>();
    for (const b of bullets) {
      seen.add(b.id);
      let slot = this.slots.get(b.id);
      if (!slot) {
        const g = new Graphics();
        g.rect(-2, -8, 4, 14).fill({ color: 0xef4444 });
        g.rect(-1, -10, 2, 4).fill({ color: 0xffffff, alpha: 0.85 });
        this.view.addChild(g);
        slot = { g };
        this.slots.set(b.id, slot);
      }
      slot.g.position.set(b.pos.x, b.pos.y);
    }
    this.slots.forEach((slot, id) => {
      if (!seen.has(id)) {
        slot.g.destroy();
        this.slots.delete(id);
      }
    });
  }

  destroy(): void {
    this.slots.forEach(slot => slot.g.destroy());
    this.slots.clear();
    this.view.destroy({ children: true });
  }
}
