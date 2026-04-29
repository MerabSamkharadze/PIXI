import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-snake-win-modal',
  imports: [RouterLink],
  templateUrl: './win-modal.html',
  styleUrl: './win-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SnakeWinModalComponent {
  readonly score = input.required<number>();
  readonly length = input.required<number>();
  readonly targetLength = input.required<number>();
  readonly best = input.required<number>();
  readonly elapsedMs = input.required<number>();

  readonly replay = output<void>();

  protected readonly stars = computed(() => {
    const t = this.elapsedMs();
    const target = this.targetLength();
    if (target <= 0 || t <= 0) return 3;
    const secPerSegment = t / 1000 / target;
    if (secPerSegment <= 1.6) return 3;
    if (secPerSegment <= 2.4) return 2;
    return 1;
  });

  protected readonly time = computed(() => {
    const total = Math.floor(this.elapsedMs() / 1000);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  });

  protected readonly verdict = computed(() => {
    switch (this.stars()) {
      case 3: return 'Reflex of legends';
      case 2: return 'Solid run';
      default: return 'Cleared';
    }
  });

  protected readonly sparkles = Array.from({ length: 22 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.6,
    duration: 1.4 + Math.random() * 1.2,
    hue: ['green', 'cyan', 'violet', 'pink'][Math.floor(Math.random() * 4)]
  }));

  protected readonly starSlots = [0, 1, 2];
}
