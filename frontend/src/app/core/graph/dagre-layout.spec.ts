import { arrangeDiagram } from './dagre-layout';
import { DiagramNode } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';

describe('arrangeDiagram', () => {
  it('separates nodes that were imported on top of each other', () => {
    const nodes = [node('a', 0, 0), node('b', 0, 0)];
    const arranged = arrangeDiagram(nodes, [edge('a', 'b')]);

    const [a, b] = ['a', 'b'].map(id => arranged.nodes.find(n => n.id === id)!);
    expect(overlaps(a, b)).toBe(false);
  });

  it('places the target below the source for a top-to-bottom flow', () => {
    const arranged = arrangeDiagram([node('a', 0, 0), node('b', 0, 0)], [edge('a', 'b')]);

    const a = arranged.nodes.find(n => n.id === 'a')!;
    const b = arranged.nodes.find(n => n.id === 'b')!;
    expect(b.position.y).toBeGreaterThan(a.position.y);
  });

  it('preserves node identity, labels and edge endpoints', () => {
    const arranged = arrangeDiagram([node('a', 0, 0), node('b', 0, 0)], [edge('a', 'b')]);

    expect(arranged.nodes.map(n => n.id).sort()).toEqual(['a', 'b']);
    expect(arranged.nodes.find(n => n.id === 'a')!.label).toBe('a');
    expect(arranged.edges[0]).toMatchObject({ sourceNodeId: 'a', targetNodeId: 'b' });
  });

  it('leaves an edge to a missing node unrouted instead of crashing', () => {
    const arranged = arrangeDiagram([node('a', 0, 0)], [edge('a', 'ghost')]);

    expect(arranged.edges[0].waypoints).toBeUndefined();
  });
});

function node(id: string, x: number, y: number): DiagramNode {
  return { id, type: 'process', label: id, position: { x, y }, size: { width: 160, height: 60 } };
}

function edge(sourceNodeId: string, targetNodeId: string): DiagramEdge {
  return { id: `${sourceNodeId}-${targetNodeId}`, sourceNodeId, targetNodeId, lineStyle: 'solid' };
}

function overlaps(first: DiagramNode, second: DiagramNode): boolean {
  return first.position.x < second.position.x + second.size.width &&
    first.position.x + first.size.width > second.position.x &&
    first.position.y < second.position.y + second.size.height &&
    first.position.y + first.size.height > second.position.y;
}
