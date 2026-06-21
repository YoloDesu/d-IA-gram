import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/theme/theme.service';

/** Header button that toggles the soft dark theme. Reused by both the editor and Mermaid pages. */
@Component({
  selector: 'app-theme-toggle',
  imports: [],
  template: `
    <button
      type="button"
      class="rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50
             dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
      [attr.aria-pressed]="theme.isDark()"
      [title]="theme.isDark() ? 'Tema claro' : 'Tema escuro'"
      (click)="theme.toggle()">
      {{ theme.isDark() ? '☀️ Claro' : '🌙 Escuro' }}
    </button>
  `
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
}
