import { Injectable } from '@angular/core';

/** Guidance embedded in the export so an LLM knows how to edit and return the Mermaid diagram. */
export const MERMAID_LLM_INSTRUCTIONS =
  'Você recebeu um fluxograma em Mermaid exportado do d-IA-gram. ' +
  'Edite o diagrama conforme o pedido do usuário e devolva APENAS um bloco de código Mermaid ' +
  'delimitado por uma cerca de código com a marca mermaid, sem texto fora do bloco. ' +
  'Use a sintaxe de flowchart do Mermaid (ex.: "flowchart TD"). O layout é automático: foque na ' +
  'estrutura (nós, conexões e rótulos), prefira ramos paralelos a cadeias verticais longas e dê a ' +
  'cada decisão saídas rotuladas (ex.: -->|sim| e -->|não|).';

/**
 * Builds the text that the user copies/downloads to send to an LLM: the instructions followed by
 * the current diagram inside a ```mermaid fence (which the importer reads back).
 */
@Injectable({ providedIn: 'root' })
export class MermaidExportService {
  /** @example buildExport('flowchart TD\n a-->b') // instructions + fenced mermaid block */
  buildExport(code: string): string {
    return `${MERMAID_LLM_INSTRUCTIONS}\n\n\`\`\`mermaid\n${code.trim()}\n\`\`\`\n`;
  }
}
