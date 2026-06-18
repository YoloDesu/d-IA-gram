/** Line rendering of a directed edge. Mirrors backend `EdgeLineStyle`. */
export type EdgeLineStyle = 'solid' | 'dashed';

/** A directed connection between two nodes. Wire-compatible with backend `EdgeDto`. */
export interface DiagramEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label?: string;
  readonly lineStyle: EdgeLineStyle;
}
