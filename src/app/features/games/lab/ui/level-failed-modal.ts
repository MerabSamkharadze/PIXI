import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-lab-level-failed-modal',
  imports: [RouterLink],
  templateUrl: './level-failed-modal.html',
  styleUrl: './modal-base.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabLevelFailedModalComponent {
  readonly levelName = input.required<string>();
  readonly levelIndex = input.required<number>();

  readonly retry = output<void>();

  protected readonly sparkles = Array.from({ length: 14 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 6,
    delay: Math.random() * 0.6,
    duration: 1.6 + Math.random() * 1.4,
    hue: ['pink', 'violet'][Math.floor(Math.random() * 2)]
  }));
}
