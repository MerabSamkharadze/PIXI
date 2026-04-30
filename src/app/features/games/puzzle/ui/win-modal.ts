import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'mg-puzzle-win-modal',
  imports: [RouterLink],
  templateUrl: './win-modal.html',
  styleUrl: './win-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PuzzleWinModalComponent {
  readonly moves = input.required<number>();
  readonly elapsedMs = input.required<number>();
  readonly bestMoves = input.required<number | null>();
  readonly bestTimeMs = input.required<number | null>();
  readonly shuffleMoves = input.required<number>();

  readonly replay = output<void>();

  protected readonly stars = computed(() => {
    const m = this.moves();
    const s = this.shuffleMoves();
    if (s <= 0) return 1;
    if (m <= s * 1.4) return 3;
    if (m <= s * 2.2) return 2;
    return 1;
  });

  protected readonly time = computed(() => formatMs(this.elapsedMs()));
  protected readonly bestTime = computed(() => {
    const t = this.bestTimeMs();
    return t === null ? '—' : formatMs(t);
  });

  protected readonly verdict = computed(() => {
    switch (this.stars()) {
      case 3: return 'Master solver';
      case 2: return 'Sharp';
      default: return 'Cleared';
    }
  });

  protected readonly isNewBestMoves = computed(() => {
    const best = this.bestMoves();
    return best !== null && this.moves() <= best;
  });

  protected readonly isNewBestTime = computed(() => {
    const best = this.bestTimeMs();
    return best !== null && this.elapsedMs() <= best;
  });

  protected readonly sparkles = Array.from({ length: 22 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.6,
    duration: 1.4 + Math.random() * 1.2,
    hue: ['cyan', 'violet', 'green', 'pink'][Math.floor(Math.random() * 4)]
  }));

  protected readonly starSlots = [0, 1, 2];
}

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
