/** Line rendering of a directed edge. Mirrors backend `EdgeLineStyle`. */
export type EdgeLineStyle = 'solid' | 'dashed';

/** A control point on an edge's routed path, in diagram (top-left origin) coordinates. */
export interface EdgePoint {
  readonly x: number;
  readonly y: number;
}

/** A directed connection between two nodes. Wire-compatible with backend `EdgeDto`. */
export interface DiagramEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly label?: string;
  readonly lineStyle: EdgeLineStyle;
  /**
   * Interior routing points computed by the dagre auto-layout (excludes the endpoints, which
   * maxGraph derives from the node perimeters). Absent for edges drawn manually by the user.
   */
  readonly waypoints?: readonly EdgePoint[];
}
