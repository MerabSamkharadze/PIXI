import { Element, Vec2 } from './element.model';

export interface LevelDef {
  readonly id: number;
  readonly name: string;
  readonly intro: string;
  readonly spawner: Vec2;
  readonly maxBalls: number;
  readonly goalCount: number;
  readonly elements: readonly Element[];
}
