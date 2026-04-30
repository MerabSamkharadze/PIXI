import { Container, Graphics } from 'pixi.js';
import { LabConfig } from '../../domain/models/lab-config.model';

const PANEL_FILL = 0x0b1020;
const PANEL_STROKE = 0x22d3ee;

export class ArenaRenderer {
  readonly view = new Container();
  private readonly bg = new Graphics();
  private config: LabConfig;

  constructor(config: LabConfig) {
    this.config = config;
    this.view.addChild(this.bg);
    this.draw();
  }

  setConfig(config: LabConfig): void {
    if (config === this.config) return;
    this.config = config;
    this.draw();
  }

  destroy(): void {
    this.view.destroy({ children: true });
  }

  private draw(): void {
    const { fieldWidth, fieldHeight, fieldPadding } = this.config;
    this.bg.clear();
    this.bg
      .roundRect(0, 0, fieldWidth, fieldHeight, 16)
      .fill({ color: PANEL_FILL, alpha: 0.7 })
      .stroke({ width: 2, color: PANEL_STROKE, alpha: 0.45 });
    this.bg
      .roundRect(fieldPadding, fieldPadding, fieldWidth - fieldPadding * 2, fieldHeight - fieldPadding * 2, 12)
      .stroke({ width: 1, color: 0x1f2a4a, alpha: 0.6 });
  }
}
