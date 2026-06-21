import { CellStyle, EdgeStyle } from '@maxgraph/core';
import { NodeType } from '../../shared/models/node.model';
import { EdgeLineStyle } from '../../shared/models/edge.model';
import { PARALLELOGRAM_SHAPE } from './parallelogram-shape';

interface NodePalette {
  readonly fill: string;
  readonly stroke: string;
}

/** Distinct fill/stroke per node type so the four shapes read clearly on the canvas. */
const PALETTE: Record<NodeType, NodePalette> = {
  process: { fill: '#dae8fc', stroke: '#6c8ebf' },
  decision: { fill: '#fff2cc', stroke: '#d6b656' },
  terminal: { fill: '#d5e8d4', stroke: '#82b366' },
  io: { fill: '#f8cecc', stroke: '#b85450' }
};

const SHAPE: Record<NodeType, CellStyle> = {
  process: { shape: 'rectangle', rounded: false },
  decision: { shape: 'rhombus' },
  terminal: { shape: 'rectangle', rounded: true, arcSize: 40 },
  io: { shape: PARALLELOGRAM_SHAPE }
};

/** Builds the maxGraph cell style for a flowchart node of the given type. */
export function buildNodeStyle(type: NodeType): CellStyle {
  const palette = PALETTE[type];
  return {
    ...SHAPE[type],
    fillColor: palette.fill,
    strokeColor: palette.stroke,
    fontColor: '#1e293b',
    fontSize: 13,
    whiteSpace: 'wrap'
  };
}

/**
 * Builds the maxGraph cell style for a directed edge. `labelBackgroundColor` keeps edge labels
 * readable where a line passes near a block.
 *
 * `routed` edges follow dagre-computed waypoints, so they use no built-in edgeStyle (a connector
 * would discard the waypoints and re-route through blocks). Manual edges have no waypoints, so they
 * use the orthogonal connector for clean, deterministic, zoom-stable right-angle routing.
 */
export function buildEdgeStyle(lineStyle: EdgeLineStyle, routed = false): CellStyle {
  return {
    ...(routed ? {} : { edgeStyle: EdgeStyle.OrthConnector, orthogonal: true }),
    endArrow: 'classic',
    strokeColor: '#475569',
    dashed: lineStyle === 'dashed',
    rounded: true,
    labelBackgroundColor: '#ffffff'
  };
}
