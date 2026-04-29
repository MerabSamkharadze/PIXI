import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { GAMES } from '../../games-config';
import { GameCardComponent } from './ui/game-card';

@Component({
  selector: 'mg-hub',
  imports: [GameCardComponent],
  templateUrl: './hub.html',
  styleUrl: './hub.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HubComponent {
  protected readonly games = GAMES;
  protected readonly liveCount = computed(() =>
    this.games.filter(g => !g.manifest.disabled).length
  );
  protected readonly totalCount = this.games.length;
}
