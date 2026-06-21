import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LlmImportService } from '../../core/export/llm-import.service';
import { ExportedDiagram } from '../../core/export/llm-format.types';
import { readTextFile } from '../../shared/read-text-file';

/** Modal to paste LLM-modified JSON, validate it, and emit the parsed diagrams. */
@Component({
  selector: 'app-import-dialog',
  imports: [FormsModule],
  templateUrl: './import-dialog.html',
  styleUrl: './dialog.css'
})
export class ImportDialog {
  private readonly importer = inject(LlmImportService);

  readonly imported = output<ExportedDiagram[]>();
  readonly closed = output<void>();

  protected readonly raw = signal('');
  protected readonly errors = signal<string[]>([]);

  protected submit(): void {
    const result = this.importer.parse(this.raw());
    if (!result.ok) {
      this.errors.set(result.errors);
      return;
    }
    this.errors.set([]);
    this.imported.emit(result.value);
  }

  /** Loads a picked .json file into the text area and validates it immediately. */
  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file)
      return;
    this.raw.set(await readTextFile(file));
    this.submit();
  }
}
