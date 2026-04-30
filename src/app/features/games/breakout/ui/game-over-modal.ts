import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-breakout-game-over-modal',
  imports: [RouterLink],
  templateUrl: './game-over-modal.html',
  styleUrl: './game-over-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreakoutGameOverModalComponent {
  readonly score = input.required<number>();
  readonly level = input.required<number>();
  readonly elapsedMs = input.required<number>();
  readonly bestScore = input.required<number>();

  readonly retry = output<void>();

  protected readonly time = computed(() => {
    const total = Math.floor(this.elapsedMs() / 1000);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  });

  protected readonly isNewBest = computed(() => this.score() > 0 && this.score() >= this.bestScore());

  protected readonly verdict = computed(() => {
    if (this.isNewBest()) return 'New personal best';
    if (this.level() >= 4) return 'Strong run';
    if (this.score() === 0) return 'Brick by brick';
    return 'Keep grinding';
  });

  protected readonly sparkles = Array.from({ length: 18 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 7,
    delay: Math.random() * 0.6,
    duration: 1.5 + Math.random() * 1.4,
    hue: ['amber', 'pink', 'violet'][Math.floor(Math.random() * 3)]
  }));
}
