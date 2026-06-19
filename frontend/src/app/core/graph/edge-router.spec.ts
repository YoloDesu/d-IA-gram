import { DiagramEdge } from '../../shared/models/edge.model';
import { DiagramNode } from '../../shared/models/node.model';
import { buildEdgeWaypoints } from './edge-router';

describe('buildEdgeWaypoints', () => {
  it('keeps a direct edge when no node blocks the path', () => {
    const nodes = [node('a', 100, 0), node('b', 100, 180)];
    const waypoints = buildEdgeWaypoints(nodes, edge('a', 'b'));

    expect(waypoints).toEqual([]);
  });

  it('routes around a node sitting between source and target', () => {
    const nodes = [node('a', 100, 0), node('blocked', 100, 110), node('b', 100, 240)];
    const waypoints = buildEdgeWaypoints(nodes, edge('a', 'b'));

    expect(waypoints.length).toBeGreaterThan(0);
    expect(waypoints.some(point => point.x > 260 || point.x < 100)).toBe(true);
  });

  it('routes same-row edges above or below the row', () => {
    const nodes = [node('a', 0, 80), node('b', 260, 80)];
    const waypoints = buildEdgeWaypoints(nodes, edge('a', 'b'));

    expect(waypoints).toHaveLength(2);
    expect(waypoints.every(point => point.y < 80 || point.y > 140)).toBe(true);
  });
});

function node(id: string, x: number, y: number): DiagramNode {
  return { id, type: 'process', label: id, position: { x, y }, size: { width: 160, height: 60 } };
}

function edge(sourceNodeId: string, targetNodeId: string): DiagramEdge {
  return { id: `${sourceNodeId}-${targetNodeId}`, sourceNodeId, targetNodeId, lineStyle: 'solid' };
}
