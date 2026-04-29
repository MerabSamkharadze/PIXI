import { Container, Text } from 'pixi.js';

const LIFE_MS = 650;
const RISE_PX = 44;

export class ScorePopupRenderer {
  readonly view = new Container();
  private readonly label: Text;
  private active = false;
  private elapsed = 0;
  private originY = 0;

  constructor() {
    this.label = new Text({
      text: '+10',
      style: {
        fontFamily: 'Orbitron, "Inter", system-ui, sans-serif',
        fontWeight: '700',
        fontSize: 22,
        fill: 0xa3e635,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          alpha: 0.65,
          blur: 5,
          angle: Math.PI / 4,
          distance: 2
        }
      }
    });
    this.label.anchor.set(0.5);
    this.label.visible = false;
    this.view.addChild(this.label);
  }

  show(x: number, y: number, points: number): void {
    this.label.text = `+${points}`;
    this.label.position.set(x, y);
    this.originY = y;
    this.elapsed = 0;
    this.active = true;
    this.label.visible = true;
    this.label.alpha = 1;
  }

  tick(deltaMs: number): void {
    if (!this.active) return;
    this.elapsed += deltaMs;
    const t = this.elapsed / LIFE_MS;
    if (t >= 1) {
      this.active = false;
      this.label.visible = false;
      return;
    }
    const ease = 1 - Math.pow(1 - t, 3);
    this.label.position.y = this.originY - RISE_PX * ease;
    this.label.alpha = 1 - t;
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}
