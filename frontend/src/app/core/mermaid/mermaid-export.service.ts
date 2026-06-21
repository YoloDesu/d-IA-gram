import { Injectable } from '@angular/core';
import { MermaidDiagramType } from './mermaid-diagram-types';

/** General guidance (type-agnostic) embedded in every Mermaid export. */
export const MERMAID_LLM_INSTRUCTIONS =
  'Você recebeu um diagrama em Mermaid exportado do d-IA-gram. ' +
  'Edite-o conforme o pedido do usuário e devolva APENAS um bloco de código Mermaid ' +
  'delimitado por uma cerca de código com a marca mermaid, sem texto fora do bloco. ' +
  'MANTENHA o tipo de diagrama indicado abaixo (use exatamente a palavra-chave inicial dele). ' +
  'O layout é automático: foque na estrutura e nos rótulos.';

/**
 * Builds the text the user copies/downloads to send to an LLM: a header naming the chosen modality,
 * the general instructions, the modality-specific guidance and the current diagram inside a
 * ```mermaid fence (which the importer reads back).
 */
@Injectable({ providedIn: 'root' })
export class MermaidExportService {
  /** @example buildExport('flowchart TD\n a-->b', flowchartType) // header + instructions + fenced code */
  buildExport(code: string, type: MermaidDiagramType): string {
    return [
      `Modelo de diagrama: ${type.label} (id: ${type.id}).`,
      MERMAID_LLM_INSTRUCTIONS,
      type.instruction,
      '',
      '```mermaid',
      code.trim(),
      '```',
      ''
    ].join('\n');
  }
}
