import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-breakout-victory-modal',
  imports: [RouterLink],
  templateUrl: './victory-modal.html',
  styleUrl: './victory-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreakoutVictoryModalComponent {
  readonly score = input.required<number>();
  readonly elapsedMs = input.required<number>();
  readonly bestScore = input.required<number>();

  readonly replay = output<void>();

  protected readonly time = computed(() => {
    const total = Math.floor(this.elapsedMs() / 1000);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  });

  protected readonly isNewBest = computed(() => this.score() > 0 && this.score() >= this.bestScore());

  protected readonly sparkles = Array.from({ length: 28 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 9,
    delay: Math.random() * 0.6,
    duration: 1.4 + Math.random() * 1.4,
    hue: ['amber', 'pink', 'violet', 'cyan', 'green'][Math.floor(Math.random() * 5)]
  }));
}
