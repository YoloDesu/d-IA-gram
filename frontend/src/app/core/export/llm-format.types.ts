import { DiagramNode, NodeType } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';

/** Discriminator value identifying a d-IA-gram export file. */
export const SCHEMA_ID = 'd-ia-gram-v1';
export const FORMAT_VERSION = '1.0.0';

export interface NodeTypeCapability {
  readonly type: NodeType;
  readonly shape: string;
  readonly description: string;
}

export interface EdgeTypeCapability {
  readonly type: string;
  readonly line_style: 'solid' | 'dashed';
  readonly description: string;
}

export interface LayoutHints {
  readonly flow_direction: string;
  readonly main_flow: string;
  readonly branching: string;
  readonly columns: string;
  readonly spacing: { readonly vertical: number; readonly horizontal: number };
}

export interface Capabilities {
  readonly node_types: readonly NodeTypeCapability[];
  readonly edge_types: readonly EdgeTypeCapability[];
  readonly supported_operations: readonly string[];
  readonly position_system: {
    readonly unit: string;
    readonly origin: string;
    readonly recommended_spacing: number;
  };
  readonly layout_hints: LayoutHints;
  readonly size_defaults: Record<NodeType, { readonly width: number; readonly height: number }>;
}

/** A diagram inside an export. Node/edge shapes match the app's wire format exactly. */
export interface ExportedDiagram {
  readonly id: string;
  readonly name: string;
  readonly nodes: readonly DiagramNode[];
  readonly edges: readonly DiagramEdge[];
}

/** The complete, self-describing export payload exchanged with an LLM. */
export interface LlmExportPayload {
  readonly $schema: string;
  readonly format_version: string;
  readonly instructions_for_llm: string;
  readonly capabilities: Capabilities;
  readonly diagrams: readonly ExportedDiagram[];
}
