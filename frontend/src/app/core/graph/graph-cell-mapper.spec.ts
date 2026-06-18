import { Cell } from '@maxgraph/core';
import { cellToEdge, cellToNode, nodeTypeFromStyle } from './graph-cell-mapper';
import { PARALLELOGRAM_SHAPE } from './parallelogram-shape';

/** Minimal fake cell — avoids constructing a real maxGraph Cell with DOM dependencies. */
function fakeVertex(id: string, shape: string, rounded = false): Cell {
  return {
    id,
    value: 'Label',
    style: { shape, rounded },
    getGeometry: () => ({ x: 10, y: 20, width: 100, height: 40 }),
    isEdge: () => false
  } as unknown as Cell;
}

function fakeEdge(id: string, sourceId: string, targetId: string, dashed: boolean): Cell {
  return {
    id,
    value: 'sim',
    style: { dashed },
    source: { id: sourceId },
    target: { id: targetId },
    getGeometry: () => null,
    isEdge: () => true
  } as unknown as Cell;
}

describe('nodeTypeFromStyle', () => {
  it('detects io from the parallelogram shape', () => {
    expect(nodeTypeFromStyle({ shape: PARALLELOGRAM_SHAPE })).toBe('io');
  });

  it('detects terminal from a rounded rectangle', () => {
    expect(nodeTypeFromStyle({ shape: 'rectangle', rounded: true })).toBe('terminal');
  });

  it('falls back to process for a plain rectangle', () => {
    expect(nodeTypeFromStyle({ shape: 'rectangle' })).toBe('process');
  });
});

describe('cellToNode', () => {
  it('reads geometry and type from a vertex cell', () => {
    const node = cellToNode(fakeVertex('n1', 'rhombus'));
    expect(node).toEqual({
      id: 'n1',
      type: 'decision',
      label: 'Label',
      position: { x: 10, y: 20 },
      size: { width: 100, height: 40 }
    });
  });
});

describe('cellToEdge', () => {
  it('reads endpoints and line style', () => {
    const edge = cellToEdge(fakeEdge('e1', 'a', 'b', true));
    expect(edge).toEqual({
      id: 'e1',
      sourceNodeId: 'a',
      targetNodeId: 'b',
      label: 'sim',
      lineStyle: 'dashed'
    });
  });

  it('returns null when an endpoint is missing', () => {
    const orphan = { id: 'e2', source: null, target: { id: 'b' }, isEdge: () => true } as unknown as Cell;
    expect(cellToEdge(orphan)).toBeNull();
  });
});
