import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectedCellInfo } from '../../../core/graph/graph-events';

/** Right panel for editing the selected cell's label. Empty when nothing is selected. */
@Component({
  selector: 'app-properties-panel',
  imports: [FormsModule],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.css'
})
export class PropertiesPanel {
  readonly selected = input<SelectedCellInfo | null>(null);
  readonly labelChanged = output<string>();

  protected readonly draftLabel = signal('');

  constructor() {
    // Sync the editable draft whenever the selection changes (id-keyed).
    effect(() => {
      const cell = this.selected();
      this.draftLabel.set(cell?.label ?? '');
    });
  }

  protected onLabelInput(value: string): void {
    this.draftLabel.set(value);
    this.labelChanged.emit(value);
  }
}
