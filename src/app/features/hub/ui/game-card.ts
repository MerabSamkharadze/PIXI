import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameManifest } from '../../../core/game/game.types';

@Component({
  selector: 'mg-game-card',
  imports: [RouterLink],
  templateUrl: './game-card.html',
  styleUrl: './game-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--accent]': 'manifest().accent',
    '[class.is-disabled]': 'manifest().disabled'
  }
})
export class GameCardComponent {
  readonly manifest = input.required<GameManifest>();
  protected readonly route = computed(() => {
    const m = this.manifest();
    return m.disabled ? null : ['/games', m.id];
  });
}
