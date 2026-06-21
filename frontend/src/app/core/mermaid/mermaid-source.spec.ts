import { SAMPLE_MERMAID, extractMermaidCode } from './mermaid-source';

describe('extractMermaidCode', () => {
  it('extracts the code inside a ```mermaid fence', () => {
    const text = 'instruções para a LLM\n\n```mermaid\nflowchart TD\n  a --> b\n```\n';
    expect(extractMermaidCode(text)).toBe('flowchart TD\n  a --> b');
  });

  it('extracts the code inside a generic fence without a language tag', () => {
    expect(extractMermaidCode('```\nflowchart TD\n  a --> b\n```')).toBe('flowchart TD\n  a --> b');
  });

  it('treats unfenced text as raw mermaid code', () => {
    expect(extractMermaidCode('  flowchart TD\n  a --> b  ')).toBe('flowchart TD\n  a --> b');
  });

  it('keeps the sample diagram intact when it has no fence', () => {
    expect(extractMermaidCode(SAMPLE_MERMAID)).toBe(SAMPLE_MERMAID);
  });
});
