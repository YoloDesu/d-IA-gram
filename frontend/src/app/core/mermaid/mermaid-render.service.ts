import { Injectable } from '@angular/core';
import mermaid from 'mermaid';

/**
 * Thin wrapper owning the mermaid library (CLAUDE.md: wrap third-party libs). The rest of the app
 * only sees `code in → SVG string out`, never a mermaid type. Lazy-initializes mermaid once.
 */
@Injectable({ providedIn: 'root' })
export class MermaidRenderService {
  private initialized = false;
  private renderCount = 0;

  /**
   * Renders Mermaid source to an SVG string. Rejects with the mermaid parse error when the
   * syntax is invalid, so callers can surface it to the user.
   */
  async renderToSvg(code: string): Promise<string> {
    this.ensureInitialized();
    const { svg } = await mermaid.render(`mermaid-render-${this.renderCount++}`, code);
    return svg;
  }

  private ensureInitialized(): void {
    if (this.initialized)
      return;
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
    this.initialized = true;
  }
}
