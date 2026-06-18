import { LlmExportService } from './llm-export.service';
import { SCHEMA_ID, FORMAT_VERSION } from './llm-format.types';
import { DiagramNode } from '../../shared/models/node.model';

describe('LlmExportService', () => {
  const service = new LlmExportService();
  const nodes: DiagramNode[] = [
    { id: 'n1', type: 'terminal', label: 'Início', position: { x: 0, y: 0 }, size: { width: 140, height: 50 } }
  ];

  it('stamps the schema id and format version', () => {
    const payload = service.buildFromCurrent('d1', 'Flow', nodes, []);
    expect(payload.$schema).toBe(SCHEMA_ID);
    expect(payload.format_version).toBe(FORMAT_VERSION);
  });

  it('includes instructions and the four node-type capabilities', () => {
    const payload = service.buildFromCurrent('d1', 'Flow', nodes, []);
    expect(payload.instructions_for_llm.length).toBeGreaterThan(0);
    expect(payload.capabilities.node_types).toHaveLength(4);
  });

  it('embeds the diagram nodes', () => {
    const payload = service.buildFromCurrent('d1', 'Flow', nodes, []);
    expect(payload.diagrams[0].nodes[0].label).toBe('Início');
  });

  it('serializes to valid JSON that parses back', () => {
    const payload = service.buildFromCurrent('d1', 'Flow', nodes, []);
    const parsed = JSON.parse(service.serialize(payload));
    expect(parsed.$schema).toBe(SCHEMA_ID);
  });
});
