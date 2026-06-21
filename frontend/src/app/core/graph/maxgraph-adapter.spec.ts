import { Graph, PanningHandler, RubberBandHandler } from '@maxgraph/core';
import { MaxGraphAdapterService } from './maxgraph-adapter';
import { DiagramNode } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';
import { DiagramSnapshot } from './graph-events';

const NODES: DiagramNode[] = [
  { id: 'n1', type: 'terminal', label: 'Start', position: { x: 0, y: 0 }, size: { width: 140, height: 50 } },
  { id: 'n2', type: 'process', label: 'Work', position: { x: 0, y: 120 }, size: { width: 160, height: 60 } }
];
const EDGES: DiagramEdge[] = [
  { id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n2', lineStyle: 'solid' }
];
const OVERLAPPING_NODES: DiagramNode[] = [
  { id: 'root', type: 'terminal', label: 'Start', position: { x: 0, y: 0 }, size: { width: 140, height: 50 } },
  { id: 'left', type: 'process', label: 'Left', position: { x: 0, y: 0 }, size: { width: 160, height: 60 } },
  { id: 'right', type: 'process', label: 'Right', position: { x: 0, y: 0 }, size: { width: 160, height: 60 } }
];
const BRANCH_EDGES: DiagramEdge[] = [
  { id: 'b1', sourceNodeId: 'root', targetNodeId: 'left', lineStyle: 'solid' },
  { id: 'b2', sourceNodeId: 'root', targetNodeId: 'right', lineStyle: 'solid' }
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

  it('starts in select mode with rubberband selection enabled', () => {
    const graph = graphFrom(adapter);
    const rubberBand = requireRubberBand(graph);

    expect(container.classList.contains('is-select-mode')).toBe(true);
    expect(graph.isConnectable()).toBe(true);
    expect(graph.isCellsSelectable()).toBe(true);
    expect(rubberBand.isEnabled()).toBe(true);
  });

  it('switches pan mode to left-button panning and restores select mode', () => {
    const graph = graphFrom(adapter);
    const panning = requirePanning(graph);
    const rubberBand = requireRubberBand(graph);

    adapter.setInteractionMode('pan');
    expect(container.classList.contains('is-pan-mode')).toBe(true);
    expect(graph.isConnectable()).toBe(false);
    expect(graph.isCellsSelectable()).toBe(false);
    expect(panning.useLeftButtonForPanning).toBe(true);
    expect(panning.ignoreCell).toBe(true);
    expect(rubberBand.isEnabled()).toBe(false);

    adapter.setInteractionMode('select');
    expect(graph.isConnectable()).toBe(true);
    expect(graph.isCellsMovable()).toBe(true);
    expect(rubberBand.isEnabled()).toBe(true);
  });

  it('clearDiagram removes all cells and emits an empty snapshot', () => {
    let latest: DiagramSnapshot | null = null;
    adapter.changes$.subscribe(snapshot => latest = snapshot);
    adapter.renderDiagram(NODES, EDGES);

    adapter.clearDiagram();

    expect(adapter.snapshot()).toEqual({ nodes: [], edges: [] });
    expect(latest).toEqual({ nodes: [], edges: [] });
  });

  it('zooms in, zooms out, and resets to 100%', () => {
    const graph = graphFrom(adapter);
    const initialScale = graph.getView().getScale();

    adapter.zoomIn();
    const zoomedScale = graph.getView().getScale();
    expect(zoomedScale).toBeGreaterThan(initialScale);

    adapter.zoomOut();
    expect(graph.getView().getScale()).toBeLessThan(zoomedScale);

    adapter.zoomIn();
    adapter.resetZoom();
    expect(graph.getView().getScale()).toBeCloseTo(1, 4);
  });

  it('auto-arranges imported nodes that overlap into a top-down layout', () => {
    const snapshot = adapter.renderArrangedDiagram(OVERLAPPING_NODES, BRANCH_EDGES);
    const root = snapshot.nodes.find(n => n.id === 'root')!;
    const children = snapshot.nodes.filter(n => n.id !== 'root');

    expect(children.every(child => child.position.y > root.position.y)).toBe(true);
    expect(overlaps(children[0], children[1])).toBe(false);
  });
});

function graphFrom(adapter: MaxGraphAdapterService): Graph {
  const graph = (adapter as unknown as { readonly graph: Graph | null }).graph;
  if (!graph)
    throw new Error('Expected initialized graph in MaxGraphAdapterService test.');
  return graph;
}

function requirePanning(graph: Graph): PanningHandler {
  const panning = graph.getPlugin<PanningHandler>('PanningHandler');
  if (!panning)
    throw new Error('Expected PanningHandler plugin in MaxGraphAdapterService test.');
  return panning;
}

function requireRubberBand(graph: Graph): RubberBandHandler {
  const rubberBand = graph.getPlugin<RubberBandHandler>('RubberBandHandler');
  if (!rubberBand)
    throw new Error('Expected RubberBandHandler plugin in MaxGraphAdapterService test.');
  return rubberBand;
}

function overlaps(first: DiagramNode, second: DiagramNode): boolean {
  return first.position.x < second.position.x + second.size.width &&
    first.position.x + first.size.width > second.position.x &&
    first.position.y < second.position.y + second.size.height &&
    first.position.y + first.size.height > second.position.y;
}
