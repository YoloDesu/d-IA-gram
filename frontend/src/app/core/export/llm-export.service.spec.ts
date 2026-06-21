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

  it('includes layout hints so the LLM spreads branches horizontally', () => {
    const hints = service.buildFromCurrent('d1', 'Flow', nodes, []).capabilities.layout_hints;
    expect(hints.flow_direction).toBe('top-to-bottom');
    expect(hints.spacing.horizontal).toBe(340);
    expect(hints.branching.length).toBeGreaterThan(0);
  });

  it('tells the LLM that layout is automatic and to favour parallel branches', () => {
    const payload = service.buildFromCurrent('d1', 'Flow', nodes, []);

    expect(payload.instructions_for_llm).toContain('LAYOUT É AUTOMÁTICO');
    expect(payload.capabilities.layout_hints.main_flow).toContain('AUTOMÁTICO');
    expect(payload.capabilities.layout_hints.branching).toContain('paralelos');
  });

  it('omits dagre waypoints from exported edges (the LLM works on structure)', () => {
    const edges = [{ id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n1', lineStyle: 'solid' as const, waypoints: [{ x: 1, y: 2 }] }];
    const payload = service.buildFromCurrent('d1', 'Flow', nodes, edges);
    expect(payload.diagrams[0].edges[0]).not.toHaveProperty('waypoints');
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
