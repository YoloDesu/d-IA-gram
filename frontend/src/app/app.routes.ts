import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/projects/project-list').then(m => m.ProjectList)
  },
  {
    path: 'project/:projectId',
    loadComponent: () =>
      import('./features/editor/editor').then(m => m.Editor)
  },
  { path: '**', redirectTo: '' }
];
