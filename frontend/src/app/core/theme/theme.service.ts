import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'd-ia-gram-theme';

/**
 * Owns the light/dark theme. Toggling flips the `dark` class on <html> (which drives the Tailwind
 * `dark:` variants) and persists the choice. The initial value mirrors the inline boot script in
 * index.html, so there is no flash on load.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(this.readInitial());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(dark => !dark);
  }

  private readInitial(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light')
      return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
