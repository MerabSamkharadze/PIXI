import { Routes } from '@angular/router';
import { GAMES } from './games-config';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/hub/hub').then(m => m.HubComponent)
  },
  ...GAMES.filter(g => !g.manifest.disabled).map(g => ({
    path: `games/${g.manifest.id}`,
    loadComponent: g.loadShell
  })),
  { path: '**', redirectTo: '' }
];
