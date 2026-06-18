import { DiagramNode } from './node.model';
import { DiagramEdge } from './edge.model';

/** Full diagram as returned by the API (GET) and sent back on save (PUT). */
export interface Diagram {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly nodes: readonly DiagramNode[];
  readonly edges: readonly DiagramEdge[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Body for POST (create empty diagram). */
export interface CreateDiagramRequest {
  readonly name: string;
}

/** Body for PUT (full replace of name, nodes and edges). */
export interface SaveDiagramRequest {
  readonly name: string;
  readonly nodes: readonly DiagramNode[];
  readonly edges: readonly DiagramEdge[];
}
