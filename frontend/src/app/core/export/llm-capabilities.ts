import { Capabilities } from './llm-format.types';

/**
 * The capabilities contract embedded in every export so an LLM knows what it may do.
 * Mirrors the backend `LlmExportBuilder.BuildCapabilities()` — keep both in sync.
 */
export const CAPABILITIES: Capabilities = {
  node_types: [
    { type: 'process', shape: 'rectangle', description: 'Passo de processamento / ação.' },
    { type: 'decision', shape: 'diamond', description: 'Ponto de decisão; normalmente tem duas saídas (sim/não).' },
    { type: 'terminal', shape: 'rounded_rectangle', description: 'Início ou fim do fluxo. Rótulo típico: "Início" ou "Fim".' },
    { type: 'io', shape: 'parallelogram', description: 'Entrada ou saída de dados (ler/escrever).' }
  ],
  edge_types: [
    { type: 'directed_solid', line_style: 'solid', description: 'Fluxo de controle padrão.' },
    { type: 'directed_dashed', line_style: 'dashed', description: 'Fluxo opcional ou de exceção.' }
  ],
  supported_operations: [
    'add_node', 'remove_node', 'update_node_label', 'update_node_position',
    'add_edge', 'remove_edge', 'update_edge_label'
  ],
  position_system: { unit: 'px', origin: 'top-left', recommended_spacing: 120 },
  size_defaults: {
    process: { width: 160, height: 60 },
    decision: { width: 120, height: 80 },
    terminal: { width: 140, height: 50 },
    io: { width: 160, height: 60 }
  }
};

export const LLM_INSTRUCTIONS =
  'Você recebeu um arquivo de exportação do d-IA-gram (editor de fluxogramas). ' +
  'Modifique APENAS o array "diagrams" seguindo as regras em "capabilities". ' +
  'Use somente os "node_types" (campo type) e "line_style" de "edge_types" listados. ' +
  'Preserve o "id" de cada nó/aresta existente; para novos elementos gere um UUID v4. ' +
  'Toda aresta deve referenciar "sourceNodeId" e "targetNodeId" de nós existentes. ' +
  'Posições em pixels (origem no canto superior esquerdo). ' +
  'Retorne o JSON COMPLETO (com $schema, format_version, capabilities e diagrams), sem texto extra fora do JSON.';
