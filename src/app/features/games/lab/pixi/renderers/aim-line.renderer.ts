import { Container, Graphics } from 'pixi.js';
import { Vec2 } from '../../domain/models/element.model';
import { LabConfig } from '../../domain/models/lab-config.model';

export class AimLineRenderer {
  readonly view = new Container();
  private readonly line = new Graphics();
  private readonly tip = new Graphics();
  private readonly spawnerDot = new Graphics();
  private dashOffset = 0;
  private config: LabConfig;
  private spawner: Vec2 = { x: 0, y: 0 };
  private aim: Vec2 = { x: 0, y: 0 };
  private active = false;

  constructor(config: LabConfig) {
    this.config = config;
    this.view.addChild(this.line, this.tip, this.spawnerDot);
    this.drawSpawnerDot();
  }

  setSpawner(p: Vec2): void {
    this.spawner = p;
    this.spawnerDot.position.set(p.x, p.y);
  }

  setAim(a: Vec2): void {
    this.aim = a;
  }

  setActive(active: boolean): void {
    this.active = active;
    this.view.visible = active;
  }

  setConfig(config: LabConfig): void {
    this.config = config;
    this.drawSpawnerDot();
  }

  tick(deltaMs: number): void {
    if (!this.active) return;
    this.dashOffset = (this.dashOffset + deltaMs * 0.04) % 12;
    this.redraw();
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private drawSpawnerDot(): void {
    this.spawnerDot.clear();
    this.spawnerDot.circle(0, 0, 9).fill({ color: 0x22d3ee, alpha: 0.18 })
      .stroke({ width: 1.5, color: 0x22d3ee, alpha: 0.85 });
    this.spawnerDot.circle(0, 0, 4).fill({ color: 0x22d3ee, alpha: 0.95 });
  }

  private redraw(): void {
    this.line.clear();
    this.tip.clear();
    let dx = this.aim.x - this.spawner.x;
    let dy = this.aim.y - this.spawner.y;
    const len = Math.hypot(dx, dy);
    if (len < this.config.minAimLen) return;
    const capped = Math.min(len, this.config.maxAimLen);
    dx = (dx / len) * capped;
    dy = (dy / len) * capped;
    const tx = this.spawner.x + dx;
    const ty = this.spawner.y + dy;

    const dash = 6;
    const gap = 6;
    const total = dash + gap;
    const segments = Math.floor(capped / total);
    for (let i = 0; i < segments; i++) {
      const start = i * total + this.dashOffset;
      const end = start + dash;
      if (start > capped) break;
      const s = Math.min(start, capped);
      const e = Math.min(end, capped);
      const sx = this.spawner.x + (dx / capped) * s;
      const sy = this.spawner.y + (dy / capped) * s;
      const ex = this.spawner.x + (dx / capped) * e;
      const ey = this.spawner.y + (dy / capped) * e;
      this.line
        .moveTo(sx, sy)
        .lineTo(ex, ey)
        .stroke({ width: 2, color: 0x22d3ee, alpha: 0.65 });
    }

    this.tip.circle(tx, ty, 5).fill({ color: 0x22d3ee, alpha: 0.7 })
      .stroke({ width: 1.5, color: 0xffffff, alpha: 0.85 });
  }
}
