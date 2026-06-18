import { DiagramNode, NodeType } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';

/** Whole-diagram state read back from the canvas after a user edit. */
export interface DiagramSnapshot {
  readonly nodes: DiagramNode[];
  readonly edges: DiagramEdge[];
}

/** The currently selected cell, surfaced to the properties panel. */
export interface SelectedCellInfo {
  readonly id: string;
  readonly kind: 'node' | 'edge';
  readonly label: string;
}

/** Default pixel size used when the user inserts a new node of each type. */
export const DEFAULT_NODE_SIZE: Record<NodeType, { width: number; height: number }> = {
  process: { width: 160, height: 60 },
  decision: { width: 120, height: 80 },
  terminal: { width: 140, height: 50 },
  io: { width: 160, height: 60 }
};
