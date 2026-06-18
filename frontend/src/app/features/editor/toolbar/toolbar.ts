import { Component, input, output } from '@angular/core';
import { NodeType } from '../../../shared/models/node.model';

interface NodeButton {
  readonly type: NodeType;
  readonly label: string;
}

/** Presentational toolbar. Emits user intents; holds no editor state. */
@Component({
  selector: 'app-toolbar',
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css'
})
export class Toolbar {
  readonly saving = input(false);
  readonly canDelete = input(false);

  readonly addNode = output<NodeType>();
  readonly deleteSelected = output<void>();
  readonly exportRequested = output<void>();
  readonly importRequested = output<void>();

  protected readonly nodeButtons: readonly NodeButton[] = [
    { type: 'terminal', label: 'Terminal' },
    { type: 'process', label: 'Processo' },
    { type: 'decision', label: 'Decisão' },
    { type: 'io', label: 'E/S' }
  ];
}
