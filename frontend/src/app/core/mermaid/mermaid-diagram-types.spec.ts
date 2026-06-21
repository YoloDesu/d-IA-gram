import { MERMAID_DIAGRAM_TYPES, detectDiagramType } from './mermaid-diagram-types';

describe('MERMAID_DIAGRAM_TYPES', () => {
  it('offers the four requested modalities plus the default flowchart', () => {
    const ids = MERMAID_DIAGRAM_TYPES.map(t => t.id);
    expect(ids).toEqual(['flowchart', 'ishikawa', 'kanban', 'quadrant', 'gantt']);
  });

  it('gives every modality a non-empty sample and instruction', () => {
    for (const type of MERMAID_DIAGRAM_TYPES) {
      expect(type.sample.trim().length).toBeGreaterThan(0);
      expect(type.instruction.trim().length).toBeGreaterThan(0);
    }
  });

  it("starts each sample with one of the type's keywords", () => {
    for (const type of MERMAID_DIAGRAM_TYPES) {
      const firstWord = type.sample.trim().split(/[\s\n]/)[0].toLowerCase();
      expect(type.keywords).toContain(firstWord);
    }
  });
});

describe('detectDiagramType', () => {
  it('detects each modality from the leading keyword', () => {
    expect(detectDiagramType('flowchart TD\n a-->b')?.id).toBe('flowchart');
    expect(detectDiagramType('ishikawa-beta\nEfeito')?.id).toBe('ishikawa');
    expect(detectDiagramType('kanban\n  c[col]')?.id).toBe('kanban');
    expect(detectDiagramType('quadrantChart\n title X')?.id).toBe('quadrant');
    expect(detectDiagramType('gantt\n title X')?.id).toBe('gantt');
  });

  it('treats "graph" as a flowchart', () => {
    expect(detectDiagramType('graph LR\n a-->b')?.id).toBe('flowchart');
  });

  it('returns undefined for an unknown diagram keyword', () => {
    expect(detectDiagramType('sequenceDiagram\n A->>B: hi')).toBeUndefined();
  });
});
