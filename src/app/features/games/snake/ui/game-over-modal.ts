import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-snake-game-over-modal',
  imports: [RouterLink],
  templateUrl: './game-over-modal.html',
  styleUrl: './game-over-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnakeGameOverModalComponent {
  readonly score = input.required<number>();
  readonly length = input.required<number>();
  readonly best = input.required<number>();
  readonly elapsedMs = input.required<number>();

  readonly retry = output<void>();

  protected readonly time = computed(() => {
    const total = Math.floor(this.elapsedMs() / 1000);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  });

  protected readonly isNewBest = computed(() => this.score() > 0 && this.score() >= this.best());

  protected readonly verdict = computed(() => {
    if (this.isNewBest()) return 'New personal best';
    if (this.score() === 0) return 'Tough luck — try again';
    return 'You bit yourself. Again?';
  });

  protected readonly sparkles = Array.from({ length: 16 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 6,
    delay: Math.random() * 0.6,
    duration: 1.6 + Math.random() * 1.4,
    hue: ['pink', 'amber'][Math.floor(Math.random() * 2)]
  }));
}
