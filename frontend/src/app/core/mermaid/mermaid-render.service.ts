import { Injectable } from '@angular/core';
import mermaid from 'mermaid';

/**
 * Thin wrapper owning the mermaid library (CLAUDE.md: wrap third-party libs). The rest of the app
 * only sees `code in → SVG string out`, never a mermaid type. Lazy-initializes mermaid once.
 */
export type MermaidTheme = 'default' | 'dark';

@Injectable({ providedIn: 'root' })
export class MermaidRenderService {
  private appliedTheme: MermaidTheme | null = null;
  private renderCount = 0;

  /**
   * Renders Mermaid source to an SVG string using the given theme ('dark' for the app's dark mode).
   * Rejects with the mermaid parse error when the syntax is invalid, so callers can surface it.
   */
  async renderToSvg(code: string, theme: MermaidTheme = 'default'): Promise<string> {
    this.ensureTheme(theme);
    const { svg } = await mermaid.render(`mermaid-render-${this.renderCount++}`, code);
    return svg;
  }

  private ensureTheme(theme: MermaidTheme): void {
    if (this.appliedTheme === theme)
      return;
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme });
    this.appliedTheme = theme;
  }
}
