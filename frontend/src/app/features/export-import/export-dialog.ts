import { Component, input, output, signal } from '@angular/core';

/** Modal that shows the LLM export JSON with copy-to-clipboard and download actions. */
@Component({
  selector: 'app-export-dialog',
  imports: [],
  templateUrl: './export-dialog.html',
  styleUrl: './dialog.css'
})
export class ExportDialog {
  readonly json = input.required<string>();
  readonly fileName = input('diagrama.json');
  readonly closed = output<void>();

  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.json());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  protected download(): void {
    const blob = new Blob([this.json()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.fileName();
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
