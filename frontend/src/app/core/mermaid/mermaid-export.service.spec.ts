import { MermaidExportService } from './mermaid-export.service';
import { extractMermaidCode } from './mermaid-source';
import { MERMAID_DIAGRAM_TYPES } from './mermaid-diagram-types';

describe('MermaidExportService', () => {
  const service = new MermaidExportService();
  const flowchart = MERMAID_DIAGRAM_TYPES.find(t => t.id === 'flowchart')!;
  const gantt = MERMAID_DIAGRAM_TYPES.find(t => t.id === 'gantt')!;

  it('embeds the general LLM instructions before the diagram', () => {
    const out = service.buildExport('flowchart TD\n a --> b', flowchart);
    expect(out).toContain('devolva APENAS um bloco de código Mermaid');
  });

  it('names the chosen modality so the LLM keeps it', () => {
    const out = service.buildExport('gantt\n title X', gantt);
    expect(out).toContain('Modelo de diagrama: Gantt');
    expect(out).toContain(gantt.instruction);
  });

  it('wraps the code in a ```mermaid fence', () => {
    const out = service.buildExport('flowchart TD\n a --> b', flowchart);
    expect(out).toContain('```mermaid');
    expect(out).toContain('flowchart TD');
  });

  it('round-trips: the export can be re-imported back to the original code', () => {
    const code = 'flowchart TD\n  a --> b';
    expect(extractMermaidCode(service.buildExport(code, flowchart))).toBe(code);
  });
});
