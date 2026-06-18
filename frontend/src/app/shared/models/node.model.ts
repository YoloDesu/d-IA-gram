/**
 * Flowchart node shape categories. Mirrors the backend `NodeType` enum
 * (DiAGram.Api/Dtos/NodeDto.cs) — values are the lowercase wire strings.
 */
export type NodeType = 'process' | 'decision' | 'terminal' | 'io';

export interface NodePosition {
  readonly x: number;
  readonly y: number;
}

export interface NodeSize {
  readonly width: number;
  readonly height: number;
}

/** A single node. Wire-compatible with the backend `NodeDto`. */
export interface DiagramNode {
  readonly id: string;
  readonly type: NodeType;
  readonly label: string;
  readonly position: NodePosition;
  readonly size: NodeSize;
}
