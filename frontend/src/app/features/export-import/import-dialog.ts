import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LlmImportService } from '../../core/export/llm-import.service';
import { ExportedDiagram } from '../../core/export/llm-format.types';

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
}
