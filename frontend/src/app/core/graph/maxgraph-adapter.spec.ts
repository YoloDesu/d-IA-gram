import { MaxGraphAdapterService } from './maxgraph-adapter';
import { DiagramNode } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';

const NODES: DiagramNode[] = [
  { id: 'n1', type: 'terminal', label: 'Start', position: { x: 0, y: 0 }, size: { width: 140, height: 50 } },
  { id: 'n2', type: 'process', label: 'Work', position: { x: 0, y: 120 }, size: { width: 160, height: 60 } }
];
const EDGES: DiagramEdge[] = [
  { id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n2', lineStyle: 'solid' }
];

describe('MaxGraphAdapterService', () => {
  let adapter: MaxGraphAdapterService;
  let container: HTMLElement;

  beforeEach(() => {
    adapter = new MaxGraphAdapterService();
    container = document.createElement('div');
    document.body.appendChild(container);
    adapter.initializeGraph(container);
  });

  afterEach(() => {
    adapter.destroyGraph();
    container.remove();
  });

  it('round-trips a rendered diagram through snapshot()', () => {
    adapter.renderDiagram(NODES, EDGES);

    const snapshot = adapter.snapshot();

    expect(snapshot.nodes.map(n => n.id).sort()).toEqual(['n1', 'n2']);
    expect(snapshot.edges).toHaveLength(1);
    expect(snapshot.edges[0]).toMatchObject({ sourceNodeId: 'n1', targetNodeId: 'n2' });
  });

  it('preserves node type on round-trip', () => {
    adapter.renderDiagram(NODES, EDGES);

    const terminal = adapter.snapshot().nodes.find(n => n.id === 'n1');

    expect(terminal?.type).toBe('terminal');
  });

  it('insertNode adds a node and emits a change snapshot', () => {
    let emitted = 0;
    adapter.changes$.subscribe(() => emitted++);

    adapter.insertNode('decision');

    expect(adapter.snapshot().nodes.some(n => n.type === 'decision')).toBe(true);
    expect(emitted).toBeGreaterThan(0);
  });
});
