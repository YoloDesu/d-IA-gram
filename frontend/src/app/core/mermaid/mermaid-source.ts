/** Starter diagram shown when the Mermaid page first opens. */
export const SAMPLE_MERMAID = `flowchart TD
  start([Início]) --> ask{Precisa revisar?}
  ask -->|sim| review[Revisar conteúdo]
  ask -->|não| publish[Publicar]
  review --> publish
  publish --> done([Fim])`;

/** Matches a ```mermaid fenced block so an exported file (instructions + fence) round-trips on import. */
const FENCE = /```(?:mermaid)?\s*([\s\S]*?)```/i;

/**
 * Extracts the Mermaid code from an imported file's text. Exports wrap the code in a ```mermaid
 * fence after the instructions, so prefer the fenced block; otherwise treat the whole file as code.
 *
 * @example
 *   extractMermaidCode('instruções...\n```mermaid\nflowchart TD\n a-->b\n```') // 'flowchart TD\n a-->b'
 */
export function extractMermaidCode(text: string): string {
  const fenced = FENCE.exec(text);
  return (fenced ? fenced[1] : text).trim();
}
