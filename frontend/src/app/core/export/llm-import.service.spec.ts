import { LlmImportService } from './llm-import.service';
import { LlmExportService } from './llm-export.service';
import { DiagramNode } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';

describe('LlmImportService', () => {
  const importer = new LlmImportService();
  const exporter = new LlmExportService();

  const nodes: DiagramNode[] = [
    { id: 'n1', type: 'terminal', label: 'Início', position: { x: 0, y: 0 }, size: { width: 140, height: 50 } },
    { id: 'n2', type: 'process', label: 'Passo', position: { x: 0, y: 120 }, size: { width: 160, height: 60 } }
  ];
  const edges: DiagramEdge[] = [
    { id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n2', lineStyle: 'solid' }
  ];

  function validJson(): string {
    return exporter.serialize(exporter.buildFromCurrent('d1', 'Flow', nodes, edges));
  }

  it('parses a valid export round-trip', () => {
    const result = importer.parse(validJson());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].nodes).toHaveLength(2);
      expect(result.value[0].edges).toHaveLength(1);
    }
  });

  it('rejects invalid JSON syntax', () => {
    const result = importer.parse('{ not json');
    expect(result.ok).toBe(false);
  });

  it('rejects a wrong $schema', () => {
    const result = importer.parse(JSON.stringify({ $schema: 'wrong', format_version: '1.0.0', diagrams: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.some(e => e.includes('$schema'))).toBe(true);
  });

  it('rejects an edge referencing a missing node', () => {
    const payload = JSON.parse(validJson());
    payload.diagrams[0].edges[0].targetNodeId = 'ghost';
    const result = importer.parse(JSON.stringify(payload));
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.some(e => e.includes('inexistente'))).toBe(true);
  });

  it('rejects duplicate node ids', () => {
    const payload = JSON.parse(validJson());
    payload.diagrams[0].nodes[1].id = 'n1';
    const result = importer.parse(JSON.stringify(payload));
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.some(e => e.includes('duplicado'))).toBe(true);
  });

  it('fills the default size when a node omits it', () => {
    const payload = JSON.parse(validJson());
    delete payload.diagrams[0].nodes[0].size;
    const result = importer.parse(JSON.stringify(payload));
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.value[0].nodes[0].size).toEqual({ width: 140, height: 50 });
  });

  it('expands imported nodes so long LLM labels do not overlap the box', () => {
    const payload = JSON.parse(validJson());
    payload.diagrams[0].nodes[0].label = 'Validar requisitos, riscos, integrações e critérios de aceite';
    payload.diagrams[0].nodes[0].size = { width: 80, height: 30 };
    const result = importer.parse(JSON.stringify(payload));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0].nodes[0].size.width).toBeGreaterThan(80);
      expect(result.value[0].nodes[0].size.height).toBeGreaterThan(30);
    }
  });
});
