import { SAMPLE_MERMAID } from './mermaid-source';

/** A Mermaid diagram modality offered in the header (starter sample + LLM guidance). */
export interface MermaidDiagramType {
  readonly id: 'flowchart' | 'ishikawa' | 'kanban' | 'quadrant' | 'gantt';
  readonly label: string;
  /** Lowercase starting keywords used to detect the type from imported code. */
  readonly keywords: readonly string[];
  /** A valid starter diagram loaded when the user picks this modality. */
  readonly sample: string;
  /** Model-specific guidance embedded in the export so the LLM keeps the chosen modality. */
  readonly instruction: string;
}

// Ishikawa and Kanban are indentation-sensitive (level = leading-whitespace length), so these
// samples are built line-by-line to make the exact indentation explicit and unambiguous.
const ISHIKAWA_SAMPLE = [
  'ishikawa-beta',
  'Alto índice de retrabalho',
  '  Método',
  '    Procedimento desatualizado',
  '    Falta de padrão',
  '  Máquina',
  '    Calibração incorreta',
  '  Mão de obra',
  '    Treinamento insuficiente',
  '  Material',
  '    Fornecedor inconsistente',
  '  Medição',
  '    Instrumento impreciso',
  '  Meio ambiente',
  '    Iluminação inadequada'
].join('\n');

const KANBAN_SAMPLE = [
  'kanban',
  '  todo[A fazer]',
  '    t1[Levantar requisitos]',
  '    t2[Escrever especificação]',
  '  doing[Em progresso]',
  '    t3[Implementar feature]',
  '  done[Concluído]',
  '    t4[Deploy inicial]'
].join('\n');

const QUADRANT_SAMPLE = [
  'quadrantChart',
  '  title Esforço vs Impacto',
  '  x-axis Baixo esforço --> Alto esforço',
  '  y-axis Baixo impacto --> Alto impacto',
  '  quadrant-1 Fazer agora',
  '  quadrant-2 Planejar',
  '  quadrant-3 Descartar',
  '  quadrant-4 Delegar',
  '  Reescrever docs: [0.3, 0.7]',
  '  Migrar banco: [0.75, 0.8]',
  '  Ajustar cores: [0.2, 0.2]',
  '  Auditar logs: [0.6, 0.35]'
].join('\n');

const GANTT_SAMPLE = [
  'gantt',
  '  title Cronograma do projeto',
  '  dateFormat YYYY-MM-DD',
  '  section Planejamento',
  '    Levantamento de requisitos :a1, 2026-01-05, 7d',
  '    Análise                    :after a1, 5d',
  '  section Execução',
  '    Desenvolvimento :a2, 2026-01-19, 20d',
  '    Testes          :after a2, 7d'
].join('\n');

export const MERMAID_DIAGRAM_TYPES: readonly MermaidDiagramType[] = [
  {
    id: 'flowchart',
    label: 'Fluxograma',
    keywords: ['flowchart', 'graph'],
    sample: SAMPLE_MERMAID,
    instruction: 'Tipo: Fluxograma. Comece com "flowchart TD" (ou LR). Prefira ramos paralelos a ' +
      'cadeias verticais longas e dê a cada decisão {...} saídas rotuladas (ex.: -->|sim| e -->|não|).'
  },
  {
    id: 'ishikawa',
    label: 'Ishikawa',
    keywords: ['ishikawa-beta', 'ishikawa'],
    sample: ISHIKAWA_SAMPLE,
    instruction: 'Tipo: Ishikawa (espinha de peixe / causa-e-efeito). Comece com "ishikawa-beta". ' +
      'A hierarquia é por INDENTAÇÃO: a 1ª linha sem indentação é o EFEITO/problema; cada nível ' +
      'indentado a mais é uma categoria de causa (ex.: 6Ms: Método, Máquina, Mão de obra, Material, ' +
      'Medição, Meio ambiente) e, abaixo dela, as causas específicas.'
  },
  {
    id: 'kanban',
    label: 'Kanban',
    keywords: ['kanban'],
    sample: KANBAN_SAMPLE,
    instruction: 'Tipo: Kanban. Comece com "kanban". Por INDENTAÇÃO: cada COLUNA é um item de 1º ' +
      'nível no formato id[Título] (ex.: "todo[A fazer]"); as TAREFAS ficam indentadas sob a coluna ' +
      'no formato id[Descrição].'
  },
  {
    id: 'quadrant',
    label: 'Quadrant',
    keywords: ['quadrantchart'],
    sample: QUADRANT_SAMPLE,
    instruction: 'Tipo: Quadrant chart (matriz 2x2). Comece com "quadrantChart". Defina "title", ' +
      '"x-axis Baixo --> Alto", "y-axis Baixo --> Alto", os quatro "quadrant-1..4 Nome" e os pontos ' +
      'no formato "Rótulo: [x, y]" com x e y entre 0 e 1.'
  },
  {
    id: 'gantt',
    label: 'Gantt',
    keywords: ['gantt'],
    sample: GANTT_SAMPLE,
    instruction: 'Tipo: Gantt (cronograma). Comece com "gantt". Defina "title", "dateFormat ' +
      'YYYY-MM-DD", "section Nome" e tarefas no formato "Nome :id, início, duração" (ex.: ' +
      '"Análise :a1, 2026-01-05, 7d"; use "after a1" para dependências).'
  }
];

/** The modality selected by default when the Mermaid page opens. */
export const DEFAULT_DIAGRAM_TYPE = MERMAID_DIAGRAM_TYPES[0];

/** Infers the modality from code by its first keyword, so imports re-select the right type. */
export function detectDiagramType(code: string): MermaidDiagramType | undefined {
  const firstWord = code.trim().split(/[\s\n]/)[0]?.toLowerCase() ?? '';
  return MERMAID_DIAGRAM_TYPES.find(type => type.keywords.includes(firstWord));
}
