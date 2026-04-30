import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-lab-victory-modal',
  imports: [RouterLink],
  templateUrl: './victory-modal.html',
  styleUrl: './modal-base.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabVictoryModalComponent {
  readonly bestStars = input.required<Record<number, number>>();
  readonly elapsedMs = input.required<number>();

  readonly replay = output<void>();

  protected readonly totalStars = computed(() => {
    const map = this.bestStars();
    let total = 0;
    for (const k of Object.keys(map)) total += map[Number(k)] ?? 0;
    return total;
  });

  protected readonly maxStars = 36;

  protected readonly time = computed(() => {
    const total = Math.floor(this.elapsedMs() / 1000);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  });

  protected readonly sparkles = Array.from({ length: 32 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 9,
    delay: Math.random() * 0.6,
    duration: 1.4 + Math.random() * 1.4,
    hue: ['cyan', 'violet', 'pink', 'green', 'amber'][Math.floor(Math.random() * 5)]
  }));
}
