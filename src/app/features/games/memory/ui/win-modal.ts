import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-win-modal',
  imports: [RouterLink],
  templateUrl: './win-modal.html',
  styleUrl: './win-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WinModalComponent {
  readonly moves = input.required<number>();
  readonly totalPairs = input.required<number>();
  readonly elapsedMs = input.required<number>();

  readonly replay = output<void>();

  protected readonly stars = computed(() => {
    const m = this.moves();
    const p = this.totalPairs();
    if (!p) return 0;
    if (m <= p * 1.5) return 3;
    if (m <= p * 2.5) return 2;
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
      case 3: return 'Flawless';
      case 2: return 'Solid run';
      default: return 'Cleared';
    }
  });

  /* deterministic-looking random sparkles, fixed once at construction */
  protected readonly sparkles = Array.from({ length: 22 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.6,
    duration: 1.4 + Math.random() * 1.2,
    hue: ['violet', 'cyan', 'green', 'pink'][Math.floor(Math.random() * 4)]
  }));

  protected readonly starSlots = [0, 1, 2];
}
