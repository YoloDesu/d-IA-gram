import * as dagre from '@dagrejs/dagre';
import { DiagramNode } from '../../shared/models/node.model';
import { DiagramEdge, EdgePoint } from '../../shared/models/edge.model';

/** Top-to-bottom (vertical) flow; branches spread horizontally across the rank. */
const RANK_DIRECTION = 'TB';
const RANK_SEP = 90;
const NODE_SEP = 80;
const EDGE_SEP = 40;
const MARGIN = 40;

export interface ArrangedDiagram {
  readonly nodes: readonly DiagramNode[];
  readonly edges: readonly DiagramEdge[];
}

/**
 * Lays out a diagram with dagre (the engine Mermaid uses): nodes get balanced ranked positions
 * and edges get routes that go around blocks, replacing the previous tall single-column layout.
 * Pure function — it returns new node positions and edge waypoints without touching the canvas.
 *
 * @example
 *   const arranged = arrangeDiagram(nodes, edges); // arranged.nodes[i].position is recomputed
 */
export function arrangeDiagram(nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]): ArrangedDiagram {
  const nodeIds = new Set(nodes.map(node => node.id));
  const routableEdges = edges.filter(edge => nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId));
  const graph = buildGraph(nodes, routableEdges);
  dagre.layout(graph);
  return {
    nodes: nodes.map(node => repositionNode(node, graph)),
    edges: edges.map(edge => routeEdge(edge, graph, nodeIds))
  };
}

function buildGraph(nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]): dagre.graphlib.Graph {
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setGraph({ rankdir: RANK_DIRECTION, nodesep: NODE_SEP, ranksep: RANK_SEP, edgesep: EDGE_SEP, marginx: MARGIN, marginy: MARGIN });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const node of nodes)
    graph.setNode(node.id, { width: node.size.width, height: node.size.height });
  for (const edge of edges)
    graph.setEdge(edge.sourceNodeId, edge.targetNodeId, {}, edge.id);
  return graph;
}

/** dagre reports node centers; the app stores top-left, so shift by half the size. */
function repositionNode(node: DiagramNode, graph: dagre.graphlib.Graph): DiagramNode {
  const laid = graph.node(node.id);
  if (!laid)
    return node;
  return { ...node, position: { x: Math.round(laid.x - node.size.width / 2), y: Math.round(laid.y - node.size.height / 2) } };
}

/** Keeps dagre's interior route points; drops first/last since maxGraph anchors to the perimeters. */
function routeEdge(edge: DiagramEdge, graph: dagre.graphlib.Graph, nodeIds: ReadonlySet<string>): DiagramEdge {
  if (!nodeIds.has(edge.sourceNodeId) || !nodeIds.has(edge.targetNodeId))
    return { ...edge, waypoints: undefined };
  const points: EdgePoint[] = graph.edge({ v: edge.sourceNodeId, w: edge.targetNodeId, name: edge.id })?.points ?? [];
  const interior = points.slice(1, -1).map((point): EdgePoint => ({ x: Math.round(point.x), y: Math.round(point.y) }));
  return { ...edge, waypoints: interior.length > 0 ? interior : undefined };
}
