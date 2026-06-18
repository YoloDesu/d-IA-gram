import { NodeType } from '../../shared/models/node.model';
import { SCHEMA_ID } from './llm-format.types';

const VALID_NODE_TYPES: ReadonlySet<string> = new Set<NodeType>(['process', 'decision', 'terminal', 'io']);
const VALID_LINE_STYLES: ReadonlySet<string> = new Set(['solid', 'dashed']);

type Json = Record<string, unknown>;

/** Validates the top-level payload shape. Returns human-readable error messages. */
export function validatePayload(payload: unknown): string[] {
  if (!isObject(payload))
    return ['O arquivo não é um objeto JSON válido.'];
  const errors: string[] = [];
  if (payload['$schema'] !== SCHEMA_ID)
    errors.push(`Campo "$schema" deve ser "${SCHEMA_ID}" (recebido: ${stringify(payload['$schema'])}).`);
  if (typeof payload['format_version'] !== 'string')
    errors.push('Campo "format_version" ausente ou não é string.');
  if (!Array.isArray(payload['diagrams']))
    errors.push('Campo "diagrams" ausente ou não é um array.');
  else
    payload['diagrams'].forEach((d, i) => errors.push(...validateDiagram(d, i)));
  return errors;
}

function validateDiagram(diagram: unknown, index: number): string[] {
  const where = `diagrams[${index}]`;
  if (!isObject(diagram))
    return [`${where} não é um objeto.`];
  const errors: string[] = [];
  if (typeof diagram['id'] !== 'string')
    errors.push(`${where}.id ausente ou inválido.`);
  if (typeof diagram['name'] !== 'string')
    errors.push(`${where}.name ausente ou inválido.`);
  const nodeIds = validateNodes(diagram['nodes'], where, errors);
  validateEdges(diagram['edges'], where, nodeIds, errors);
  return errors;
}

function validateNodes(nodes: unknown, where: string, errors: string[]): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(nodes)) {
    errors.push(`${where}.nodes deve ser um array.`);
    return ids;
  }
  nodes.forEach((node, i) => validateNode(node, `${where}.nodes[${i}]`, ids, errors));
  return ids;
}

function validateNode(node: unknown, where: string, ids: Set<string>, errors: string[]): void {
  if (!isObject(node)) {
    errors.push(`${where} não é um objeto.`);
    return;
  }
  const id = node['id'];
  if (typeof id !== 'string')
    errors.push(`${where}.id ausente ou inválido.`);
  else if (ids.has(id))
    errors.push(`${where}.id duplicado: "${id}".`);
  else
    ids.add(id);
  if (!VALID_NODE_TYPES.has(node['type'] as string))
    errors.push(`${where}.type inválido: ${stringify(node['type'])}. Use: process, decision, terminal, io.`);
  if (!isPosition(node['position']))
    errors.push(`${where}.position deve ter x e y numéricos.`);
}

function validateEdges(edges: unknown, where: string, nodeIds: Set<string>, errors: string[]): void {
  if (!Array.isArray(edges)) {
    errors.push(`${where}.edges deve ser um array.`);
    return;
  }
  edges.forEach((edge, i) => validateEdge(edge, `${where}.edges[${i}]`, nodeIds, errors));
}

function validateEdge(edge: unknown, where: string, nodeIds: Set<string>, errors: string[]): void {
  if (!isObject(edge)) {
    errors.push(`${where} não é um objeto.`);
    return;
  }
  if (typeof edge['id'] !== 'string')
    errors.push(`${where}.id ausente ou inválido.`);
  checkEndpoint(edge['sourceNodeId'], `${where}.sourceNodeId`, nodeIds, errors);
  checkEndpoint(edge['targetNodeId'], `${where}.targetNodeId`, nodeIds, errors);
  const lineStyle = edge['lineStyle'];
  if (lineStyle !== undefined && !VALID_LINE_STYLES.has(lineStyle as string))
    errors.push(`${where}.lineStyle inválido: ${stringify(lineStyle)}. Use: solid, dashed.`);
}

function checkEndpoint(value: unknown, where: string, nodeIds: Set<string>, errors: string[]): void {
  if (typeof value !== 'string')
    errors.push(`${where} ausente ou inválido.`);
  else if (!nodeIds.has(value))
    errors.push(`${where} referencia um nó inexistente: "${value}".`);
}

function isPosition(value: unknown): boolean {
  return isObject(value) && typeof value['x'] === 'number' && typeof value['y'] === 'number';
}

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringify(value: unknown): string {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}
