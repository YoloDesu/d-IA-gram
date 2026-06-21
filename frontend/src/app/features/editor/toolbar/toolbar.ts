import { Component, input, output } from '@angular/core';
import { NodeType } from '../../../shared/models/node.model';
import { EditorTool } from '../../../core/graph/graph-events';

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
  readonly canDelete = input(false);
  readonly selectedTool = input<EditorTool>('select');

  readonly addNode = output<NodeType>();
  readonly deleteSelected = output<void>();
  readonly clearDiagram = output<void>();
  readonly toolSelected = output<EditorTool>();
  readonly zoomInRequested = output<void>();
  readonly zoomOutRequested = output<void>();
  readonly resetZoomRequested = output<void>();
  readonly exportRequested = output<void>();
  readonly importRequested = output<void>();
  readonly exportPngRequested = output<void>();
  readonly openMermaidRequested = output<void>();

  protected readonly nodeButtons: readonly NodeButton[] = [
    { type: 'terminal', label: 'Terminal' },
    { type: 'process', label: 'Processo' },
    { type: 'decision', label: 'Decisão' },
    { type: 'io', label: 'E/S' }
  ];
}
