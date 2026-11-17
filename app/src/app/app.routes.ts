import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./reportar/reportar.screen.ts').then((m) => m.ReportarScreen),
  },
  {
    path: 'resultado',
    loadComponent: () => import('./resultado/resultado.screen.ts').then((m) => m.ResultadoScreen),
  },
];
