import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-lab-level-complete-modal',
  imports: [RouterLink],
  templateUrl: './level-complete-modal.html',
  styleUrl: './modal-base.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabLevelCompleteModalComponent {
  readonly stars = input.required<number>();
  readonly levelName = input.required<string>();
  readonly levelIndex = input.required<number>();
  readonly hasNext = input.required<boolean>();

  readonly next = output<void>();
  readonly retry = output<void>();

  protected readonly starSlots = [0, 1, 2];
  protected readonly sparkles = Array.from({ length: 22 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.6,
    duration: 1.4 + Math.random() * 1.2,
    hue: ['cyan', 'violet', 'pink', 'green'][Math.floor(Math.random() * 4)]
  }));
}
