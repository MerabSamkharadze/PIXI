import { Container, Graphics } from 'pixi.js';
import {
  BumperElement,
  Element,
  GoalElement,
  PegElement,
  WallElement
} from '../../domain/models/element.model';

interface BumperSlot {
  readonly g: Graphics;
  pulse: number;
}

interface GoalSlot {
  readonly g: Graphics;
  pulse: number;
}

export class ElementsRenderer {
  readonly view = new Container();
  private readonly staticLayer = new Container();
  private readonly bumpers = new Map<number, BumperSlot>();
  private readonly goals = new Map<number, GoalSlot>();
  private bumperHits = new Map<number, number>(); // id -> ms remaining

  constructor() {
    this.view.addChild(this.staticLayer);
  }

  setElements(elements: readonly Element[]): void {
    this.staticLayer.removeChildren().forEach(c => c.destroy());
    this.bumpers.forEach(b => b.g.destroy());
    this.bumpers.clear();
    this.goals.forEach(g => g.g.destroy());
    this.goals.clear();
    this.bumperHits.clear();

    for (const el of elements) {
      switch (el.type) {
        case 'peg':    this.staticLayer.addChild(makePeg(el)); break;
        case 'wall':   this.staticLayer.addChild(makeWall(el)); break;
        case 'bumper': {
          const g = makeBumperBase(el);
          this.staticLayer.addChild(g);
          this.bumpers.set(el.id, { g, pulse: 0 });
          break;
        }
        case 'goal': {
          const g = makeGoalBase(el);
          this.staticLayer.addChild(g);
          this.goals.set(el.id, { g, pulse: Math.random() * Math.PI * 2 });
          break;
        }
        default: break;
      }
    }
  }

  flashBumper(id: number): void {
    this.bumperHits.set(id, 200);
  }

  tick(deltaMs: number): void {
    // bumper pulse
    this.bumpers.forEach((slot, id) => {
      const remaining = this.bumperHits.get(id) ?? 0;
      if (remaining > 0) {
        const next = Math.max(0, remaining - deltaMs);
        this.bumperHits.set(id, next);
        const t = 1 - next / 200;
        const scale = 1 + 0.25 * Math.sin(Math.PI * t);
        slot.g.scale.set(scale);
      } else if (slot.g.scale.x !== 1) {
        slot.g.scale.set(1);
      }
    });

    // goal pulse (subtle continuous)
    this.goals.forEach(slot => {
      slot.pulse = (slot.pulse + deltaMs * 0.0035) % (Math.PI * 2);
      slot.g.alpha = 0.8 + 0.18 * Math.sin(slot.pulse);
    });
  }

  destroy(): void {
    this.bumpers.forEach(b => b.g.destroy());
    this.bumpers.clear();
    this.goals.forEach(g => g.g.destroy());
    this.goals.clear();
    this.view.destroy({ children: true });
  }
}

function makePeg(p: PegElement): Graphics {
  const g = new Graphics();
  g.circle(0, 0, p.r).fill({ color: 0x94a3b8, alpha: 0.9 }).stroke({ width: 1, color: 0xcbd5e1, alpha: 0.6 });
  g.circle(0, -p.r * 0.35, p.r * 0.35).fill({ color: 0xffffff, alpha: 0.35 });
  g.position.set(p.x, p.y);
  return g;
}

function makeWall(w: WallElement): Graphics {
  const g = new Graphics();
  const r = Math.min(w.h, w.w) * 0.4;
  g.roundRect(-w.w / 2, -w.h / 2, w.w, w.h, r).fill({ color: 0x4a6cf7, alpha: 0.85 })
    .stroke({ width: 1, color: 0x93b4ff, alpha: 0.6 });
  g.position.set(w.cx, w.cy);
  g.rotation = w.angle;
  return g;
}

function makeBumperBase(b: BumperElement): Graphics {
  const g = new Graphics();
  g.circle(0, 0, b.r).fill({ color: 0x22d3ee, alpha: 0.55 })
    .stroke({ width: 2, color: 0x22d3ee, alpha: 1 });
  g.circle(0, 0, b.r * 0.55).fill({ color: 0xffffff, alpha: 0.45 });
  g.position.set(b.x, b.y);
  return g;
}

function makeGoalBase(go: GoalElement): Graphics {
  const g = new Graphics();
  g.circle(0, 0, go.r).fill({ color: 0xa3e635, alpha: 0.18 })
    .stroke({ width: 2, color: 0xa3e635, alpha: 0.9 });
  g.circle(0, 0, go.r * 0.6).fill({ color: 0xa3e635, alpha: 0.12 });
  g.circle(0, 0, go.r * 0.3).fill({ color: 0xa3e635, alpha: 0.6 });
  g.position.set(go.x, go.y);
  return g;
}
