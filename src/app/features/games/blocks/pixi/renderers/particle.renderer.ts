import { Container, Graphics } from 'pixi.js';

interface Particle {
  readonly g: Graphics;
  vx: number;
  vy: number;
  life: number;
  age: number;
}

export class ParticleRenderer {
  readonly view = new Container();
  private readonly active: Particle[] = [];
  private readonly pool: Graphics[] = [];

  prewarm(count: number): void {
    while (this.pool.length < count) {
      const g = new Graphics();
      g.visible = false;
      this.view.addChild(g);
      this.pool.push(g);
    }
  }

  burst(cx: number, cy: number, color: number, count = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.06 + Math.random() * 0.18;
      const life = 380 + Math.random() * 320;
      const size = 2 + Math.random() * 4;

      const g = this.acquire();
      g.clear();
      g.rect(-size / 2, -size / 2, size, size).fill({ color });
      g.position.set(cx, cy);
      g.alpha = 1;

      this.active.push({
        g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        age: 0
      });
    }
  }

  tick(deltaMs: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.age += deltaMs;
      if (p.age >= p.life) {
        this.release(p.g);
        this.active.splice(i, 1);
        continue;
      }
      const t = p.age / p.life;
      p.g.position.x += p.vx * deltaMs;
      p.g.position.y += p.vy * deltaMs;
      p.g.alpha = 1 - t;
      p.g.scale.set(1 - t * 0.4);
    }
  }

  destroy(): void {
    this.active.length = 0;
    this.pool.length = 0;
    this.view.destroy({ children: true });
  }

  private acquire(): Graphics {
    const g = this.pool.pop();
    if (g) {
      g.visible = true;
      return g;
    }
    const fresh = new Graphics();
    this.view.addChild(fresh);
    return fresh;
  }

  private release(g: Graphics): void {
    g.visible = false;
    this.pool.push(g);
  }
}
