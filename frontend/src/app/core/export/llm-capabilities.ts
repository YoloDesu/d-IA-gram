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
  position_system: { unit: 'px', origin: 'top-left', recommended_spacing: 160 },
  layout_hints: {
    flow_direction: 'top-to-bottom',
    main_flow: 'O posicionamento é AUTOMÁTICO: ao importar, o app re-organiza os nós e roteia as ' +
      'arestas com um motor de layout (dagre). Você NÃO precisa acertar pixels — use x/y apenas ' +
      'aproximados (qualquer valor válido). Concentre-se na ESTRUTURA: nós, conexões e rótulos corretos.',
    branching: 'Para um bom resultado, prefira LARGURA a profundidade: quando passos são independentes ' +
      'ou são ramos de uma "decision", modele-os como ramos paralelos (vários filhos do mesmo nó) em vez ' +
      'de uma única cadeia vertical longa. Cada "decision" deve ter 2+ arestas de saída rotuladas ' +
      '(ex.: "sim"/"não"). Rótulos de aresta curtos (1–3 palavras).',
    columns: 'Evite uma "torre" vertical de muitos nós em sequência: agrupe etapas relacionadas e ' +
      'distribua ramos lado a lado para o layout aproveitar o espaço horizontal. Reúna ramos que ' +
      'convergem em um nó comum a jusante (use um mesmo targetNodeId) em vez de duplicar caminhos.',
    spacing: { vertical: 160, horizontal: 340 }
  },
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
  'O LAYOUT É AUTOMÁTICO: o app reposiciona os nós e roteia as arestas ao importar, então as ' +
  'posições x/y que você enviar são apenas aproximadas e podem ser quaisquer valores válidos. ' +
  'Foque na estrutura e siga "layout_hints.branching" — prefira ramos paralelos (largura) a ' +
  'cadeias verticais longas, e dê a cada "decision" 2+ saídas rotuladas. ' +
  'Retorne o JSON COMPLETO (com $schema, format_version, capabilities e diagrams), sem texto extra fora do JSON.';
