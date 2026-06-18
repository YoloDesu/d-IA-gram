import { Injectable } from '@angular/core';
import { Result, err, ok } from '../../shared/result';
import { ExportedDiagram } from './llm-format.types';
import { validatePayload } from './llm-import.validator';
import { DEFAULT_NODE_SIZE } from '../graph/graph-events';
import { DiagramNode, NodeType } from '../../shared/models/node.model';
import { DiagramEdge, EdgeLineStyle } from '../../shared/models/edge.model';

/**
 * Parses and validates LLM-modified export JSON, then normalizes it into diagrams the
 * canvas can render (filling optional fields like size from the documented defaults).
 */
@Injectable({ providedIn: 'root' })
export class LlmImportService {
  /** Parses raw JSON text and validates it against the d-IA-gram schema. */
  parse(raw: string): Result<ExportedDiagram[], string[]> {
    const parsed = this.parseJson(raw);
    if (!parsed.ok)
      return parsed;
    const errors = validatePayload(parsed.value);
    if (errors.length > 0)
      return err(errors);
    const diagrams = (parsed.value as { diagrams: unknown[] }).diagrams;
    return ok(diagrams.map(d => this.normalizeDiagram(d as RawDiagram)));
  }

  private parseJson(raw: string): Result<unknown, string[]> {
    try {
      return ok(JSON.parse(raw));
    } catch (e) {
      return err([`JSON inválido: ${(e as Error).message}`]);
    }
  }

  private normalizeDiagram(diagram: RawDiagram): ExportedDiagram {
    return {
      id: diagram.id,
      name: diagram.name,
      nodes: diagram.nodes.map(n => this.normalizeNode(n)),
      edges: diagram.edges.map(e => this.normalizeEdge(e))
    };
  }

  private normalizeNode(node: RawNode): DiagramNode {
    const type = node.type as NodeType;
    const fallback = DEFAULT_NODE_SIZE[type];
    return {
      id: node.id,
      type,
      label: typeof node.label === 'string' ? node.label : '',
      position: { x: node.position.x, y: node.position.y },
      size: node.size ?? fallback
    };
  }

  private normalizeEdge(edge: RawEdge): DiagramEdge {
    return {
      id: edge.id,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      label: typeof edge.label === 'string' && edge.label ? edge.label : undefined,
      lineStyle: (edge.lineStyle as EdgeLineStyle) ?? 'solid'
    };
  }
}

// Shapes are guaranteed valid by validatePayload before normalization runs.
interface RawDiagram {
  id: string;
  name: string;
  nodes: RawNode[];
  edges: RawEdge[];
}
interface RawNode {
  id: string;
  type: string;
  label?: unknown;
  position: { x: number; y: number };
  size?: { width: number; height: number };
}
interface RawEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: unknown;
  lineStyle?: string;
}
