import { Component, input, output, signal } from '@angular/core';
import { downloadBlob } from '../../shared/file-download';

/** Modal that shows export text (LLM JSON or Mermaid) with copy-to-clipboard and download actions. */
@Component({
  selector: 'app-export-dialog',
  imports: [],
  templateUrl: './export-dialog.html',
  styleUrl: './dialog.css'
})
export class ExportDialog {
  readonly json = input.required<string>();
  readonly title = input('Exportar para LLM');
  readonly description = input(
    'Copie este texto e envie para uma LLM. Ela pode modificar o diagrama e devolver o arquivo, que você reimporta aqui.'
  );
  readonly fileName = input('diagrama.json');
  readonly mimeType = input('application/json');
  readonly closed = output<void>();

  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.json());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  protected download(): void {
    downloadBlob(new Blob([this.json()], { type: this.mimeType() }), this.fileName());
  }
}
