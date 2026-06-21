import { Cell, CellStyle } from '@maxgraph/core';
import { DiagramNode, NodeType } from '../../shared/models/node.model';
import { DiagramEdge, EdgeLineStyle, EdgePoint } from '../../shared/models/edge.model';
import { PARALLELOGRAM_SHAPE } from './parallelogram-shape';

/** Infers the flowchart node type from a cell's style (style is the source of truth). */
export function nodeTypeFromStyle(style: CellStyle): NodeType {
  if (style.shape === 'rhombus')
    return 'decision';
  if (style.shape === PARALLELOGRAM_SHAPE)
    return 'io';
  if (style.shape === 'rectangle' && style.rounded)
    return 'terminal';
  return 'process';
}

/** Reads a vertex cell back into a DiagramNode. Returns null if geometry is missing. */
export function cellToNode(cell: Cell): DiagramNode | null {
  const geometry = cell.getGeometry();
  if (!cell.id || !geometry)
    return null;
  return {
    id: cell.id,
    type: nodeTypeFromStyle(cell.style ?? {}),
    label: typeof cell.value === 'string' ? cell.value : '',
    position: { x: geometry.x, y: geometry.y },
    size: { width: geometry.width, height: geometry.height }
  };
}

/** Reads an edge cell back into a DiagramEdge. Returns null if endpoints are missing. */
export function cellToEdge(cell: Cell): DiagramEdge | null {
  const source = cell.source?.id;
  const target = cell.target?.id;
  if (!cell.id || !source || !target)
    return null;
  const lineStyle: EdgeLineStyle = cell.style?.dashed ? 'dashed' : 'solid';
  return {
    id: cell.id,
    sourceNodeId: source,
    targetNodeId: target,
    label: typeof cell.value === 'string' && cell.value ? cell.value : undefined,
    lineStyle,
    waypoints: readWaypoints(cell)
  };
}

/** Reads an edge's routed control points back from its geometry, or undefined when unrouted. */
function readWaypoints(cell: Cell): readonly EdgePoint[] | undefined {
  const points = cell.getGeometry()?.points;
  if (!points || points.length === 0)
    return undefined;
  return points.map((point): EdgePoint => ({ x: point.x, y: point.y }));
}
