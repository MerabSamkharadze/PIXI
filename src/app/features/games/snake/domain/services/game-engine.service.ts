import { Injectable, inject } from '@angular/core';
import { GameStateService } from '../state/game-state.service';
import { Cell, DELTA, Direction, OPPOSITE } from '../models/snake.model';
import { SnakeConfig } from '../models/snake-config.model';
import { spawnFood } from './food-spawner';

const POINTS_PER_FOOD = 10;

@Injectable()
export class GameEngineService {
  private readonly state = inject(GameStateService);

  start(config: SnakeConfig): void {
    const startX = Math.floor(config.cols / 2);
    const startY = Math.floor(config.rows / 2);
    const snake: Cell[] = [];
    for (let i = 0; i < config.initialLength; i++) {
      snake.push({ x: startX - i, y: startY });
    }
    const food = spawnFood(config, snake);
    if (!food) return;
    this.state.init(config, snake, food, 'right');
  }

  tick(): void {
    if (!this.state.isPlaying()) return;
    const config = this.state.config();
    if (!config) return;

    const queued = this.state.queuedDirection();
    const current = this.state.direction();
    let direction: Direction = current;
    if (queued && queued !== OPPOSITE[current]) {
      direction = queued;
    }
    this.state.setDirection(direction);

    const snake = this.state.snake();
    const head = snake[0];
    const delta = DELTA[direction];
    const newHead: Cell = {
      x: (head.x + delta.x + config.cols) % config.cols,
      y: (head.y + delta.y + config.rows) % config.rows
    };

    const food = this.state.food();
    const willEat = !!food && newHead.x === food.x && newHead.y === food.y;

    const body = willEat ? snake : snake.slice(0, -1);
    if (body.some(c => c.x === newHead.x && c.y === newHead.y)) {
      this.state.setStatus('lost');
      return;
    }

    const next: Cell[] = [newHead, ...body];
    this.state.setSnake(snake, next);

    if (willEat && food) {
      this.state.recordEat(food);
      this.state.addScore(POINTS_PER_FOOD);
      this.state.bumpSpeed();
      if (next.length >= config.targetLength) {
        this.state.setStatus('won');
        return;
      }
      const newFood = spawnFood(config, next);
      if (!newFood) {
        this.state.setStatus('won');
        return;
      }
      this.state.setFood(newFood);
    }
  }

  queueDirection(dir: Direction): void {
    if (!this.state.isPlaying()) return;
    const current = this.state.direction();
    if (dir === current || dir === OPPOSITE[current]) return;
    this.state.queueDirection(dir);
  }

  pause(): void {
    if (this.state.isPlaying()) this.state.setStatus('paused');
  }

  resume(): void {
    if (this.state.isPaused()) this.state.setStatus('playing');
  }

  togglePause(): void {
    if (this.state.isPlaying()) this.pause();
    else if (this.state.isPaused()) this.resume();
  }
}
