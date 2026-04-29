import { Container, Graphics, Text } from 'pixi.js';
import { GlowFilter } from 'pixi-filters';
import { Food } from '../../domain/models/snake.model';
import { SnakeConfig } from '../../domain/models/snake-config.model';

export class FoodRenderer {
  readonly view = new Container();
  private readonly orb = new Graphics();
  private readonly label: Text;
  private readonly glow: GlowFilter;
  private config: SnakeConfig;
  private current: Food | null = null;
  private elapsed = 0;

  constructor(config: SnakeConfig) {
    this.config = config;
    this.glow = new GlowFilter({ distance: 14, outerStrength: 1.6, innerStrength: 0.1, color: 0xff5d8f, quality: 0.3 });
    this.view.filters = [this.glow];

    this.label = new Text({
      text: '',
      style: {
        fontFamily: [
          '"Segoe UI Emoji"',
          '"Apple Color Emoji"',
          '"Noto Color Emoji"',
          'system-ui',
          'sans-serif'
        ],
        fontSize: config.cellSize * 0.7,
        fill: 0xffffff,
        align: 'center'
      }
    });
    this.label.anchor.set(0.5);
    this.view.addChild(this.orb, this.label);
    this.view.visible = false;
  }

  setConfig(config: SnakeConfig): void {
    this.config = config;
    this.label.style.fontSize = config.cellSize * 0.7;
    if (this.current) this.update(this.current);
  }

  update(food: Food | null): void {
    this.current = food;
    if (!food) {
      this.view.visible = false;
      return;
    }
    this.view.visible = true;
    const color = hslToHex(food.hue, 0.85, 0.6);
    this.glow.color = color;

    const { cellSize, boardPadding } = this.config;
    const px = boardPadding + food.x * cellSize + cellSize / 2;
    const py = boardPadding + food.y * cellSize + cellSize / 2;
    this.view.position.set(px, py);

    const r = cellSize * 0.42;
    this.orb.clear();
    this.orb
      .circle(0, 0, r)
      .fill({ color, alpha: 0.18 })
      .stroke({ width: 2, color, alpha: 0.7 });

    this.label.text = food.emoji;
  }

  tick(deltaMs: number): void {
    this.elapsed += deltaMs;
    const pulse = 1 + Math.sin(this.elapsed * 0.005) * 0.07;
    this.view.scale.set(pulse);
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }
}

function hslToHex(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  return (R << 16) | (G << 8) | B;
}
