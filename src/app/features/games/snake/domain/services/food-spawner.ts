import { Cell, Food } from '../models/snake.model';
import { SnakeConfig } from '../models/snake-config.model';

export function spawnFood(config: SnakeConfig, occupied: readonly Cell[]): Food | null {
  const total = config.cols * config.rows;
  if (occupied.length >= total) return null;

  const occupiedSet = new Set(occupied.map(c => c.y * config.cols + c.x));
  const free: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!occupiedSet.has(i)) free.push(i);
  }
  const idx = free[Math.floor(Math.random() * free.length)];
  const x = idx % config.cols;
  const y = Math.floor(idx / config.cols);
  const food = config.foodEmojis[Math.floor(Math.random() * config.foodEmojis.length)];
  return { x, y, emoji: food.emoji, hue: food.hue };
}
