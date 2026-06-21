import { MermaidExportService } from './mermaid-export.service';
import { extractMermaidCode } from './mermaid-source';

describe('MermaidExportService', () => {
  const service = new MermaidExportService();

  it('embeds the LLM instructions before the diagram', () => {
    const out = service.buildExport('flowchart TD\n a --> b');
    expect(out).toContain('devolva APENAS um bloco de código Mermaid');
  });

  it('wraps the code in a ```mermaid fence', () => {
    const out = service.buildExport('flowchart TD\n a --> b');
    expect(out).toContain('```mermaid');
    expect(out).toContain('flowchart TD');
  });

  it('round-trips: the export can be re-imported back to the original code', () => {
    const code = 'flowchart TD\n  a --> b';
    expect(extractMermaidCode(service.buildExport(code))).toBe(code);
  });
});
