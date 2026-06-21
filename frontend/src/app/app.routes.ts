import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/editor/editor').then(m => m.Editor)
  },
  {
    path: 'mermaid',
    loadComponent: () => import('./features/mermaid/mermaid-page').then(m => m.MermaidPage)
  },
  { path: '**', redirectTo: '' }
];
