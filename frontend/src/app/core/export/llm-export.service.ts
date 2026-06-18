import { Injectable } from '@angular/core';
import { ExportedDiagram, FORMAT_VERSION, LlmExportPayload, SCHEMA_ID } from './llm-format.types';
import { CAPABILITIES, LLM_INSTRUCTIONS } from './llm-capabilities';
import { Diagram } from '../../shared/models/diagram.model';
import { DiagramNode } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';

/**
 * Builds the self-describing LLM export payload from in-memory diagram state.
 * Pure transformation (no HTTP), so the user can export without saving first.
 */
@Injectable({ providedIn: 'root' })
export class LlmExportService {
  /** Builds an export containing the given diagrams (one or many). */
  buildPayload(diagrams: readonly ExportedDiagram[]): LlmExportPayload {
    return {
      $schema: SCHEMA_ID,
      format_version: FORMAT_VERSION,
      instructions_for_llm: LLM_INSTRUCTIONS,
      capabilities: CAPABILITIES,
      diagrams
    };
  }

  /** Convenience: export a single diagram from its current canvas state. */
  buildFromCurrent(
    id: string,
    name: string,
    nodes: readonly DiagramNode[],
    edges: readonly DiagramEdge[]
  ): LlmExportPayload {
    return this.buildPayload([{ id, name, nodes, edges }]);
  }

  /** Maps stored Diagram models into export diagrams. */
  fromDiagrams(diagrams: readonly Diagram[]): ExportedDiagram[] {
    return diagrams.map(d => ({ id: d.id, name: d.name, nodes: d.nodes, edges: d.edges }));
  }

  /** Serializes a payload to pretty-printed JSON for display/download. */
  serialize(payload: LlmExportPayload): string {
    return JSON.stringify(payload, null, 2);
  }
}
