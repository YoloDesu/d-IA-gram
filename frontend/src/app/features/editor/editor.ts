import { Component, inject, signal } from '@angular/core';
import { Canvas } from './canvas/canvas';
import { Toolbar } from './toolbar/toolbar';
import { PropertiesPanel } from './properties-panel/properties-panel';
import { ExportDialog } from '../export-import/export-dialog';
import { ImportDialog } from '../export-import/import-dialog';
import { MaxGraphAdapterService } from '../../core/graph/maxgraph-adapter';
import { LlmExportService } from '../../core/export/llm-export.service';
import { ExportedDiagram } from '../../core/export/llm-format.types';
import { downloadBlob } from '../../shared/file-download';
import { DiagramNode, NodeType } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';
import { DiagramSnapshot, EditorTool, SelectedCellInfo } from '../../core/graph/graph-events';

/** Identity used only to label the single diagram inside an LLM export payload. */
const DIAGRAM_ID = 'diagram';
const DIAGRAM_NAME = 'Diagrama';

/**
 * The whole app: one canvas with a toolbar and a properties panel. State lives only in the
 * canvas (maxGraph) and in memory — there is no project, no diagram list and no persistence.
 * Diagrams enter/leave via the LLM JSON import/export and the PNG download.
 */
@Component({
  selector: 'app-editor',
  imports: [Canvas, Toolbar, PropertiesPanel, ExportDialog, ImportDialog],
  templateUrl: './editor.html',
  styleUrl: './editor.css',
  providers: [MaxGraphAdapterService]
})
export class Editor {
  private readonly adapter = inject(MaxGraphAdapterService);
  private readonly exporter = inject(LlmExportService);

  protected readonly nodes = signal<readonly DiagramNode[]>([]);
  protected readonly edges = signal<readonly DiagramEdge[]>([]);
  protected readonly selectedCell = signal<SelectedCellInfo | null>(null);
  protected readonly selectedTool = signal<EditorTool>('select');
  protected readonly isEmpty = signal(true);
  protected readonly exportJson = signal('');
  protected readonly showExport = signal(false);
  protected readonly showImport = signal(false);

  protected onAddNode(type: NodeType): void {
    this.adapter.insertNode(type);
  }

  protected onDeleteSelected(): void {
    this.adapter.deleteSelection();
  }

  protected onClearDiagram(): void {
    this.adapter.clearDiagram();
  }

  protected onToolSelected(tool: EditorTool): void {
    this.selectedTool.set(tool);
    this.adapter.setInteractionMode(tool);
  }

  protected onZoomIn(): void {
    this.adapter.zoomIn();
  }

  protected onZoomOut(): void {
    this.adapter.zoomOut();
  }

  protected onResetZoom(): void {
    this.adapter.resetZoom();
  }

  protected onLabelChanged(label: string): void {
    this.adapter.updateSelectedLabel(label);
  }

  protected onSelection(cell: SelectedCellInfo | null): void {
    this.selectedCell.set(cell);
  }

  /** Tracks emptiness to toggle the canvas hint; the canvas owns the actual diagram state. */
  protected onSnapshot(snapshot: DiagramSnapshot): void {
    this.isEmpty.set(snapshot.nodes.length === 0);
  }

  protected onExport(): void {
    const snapshot = this.adapter.snapshot();
    const payload = this.exporter.buildFromCurrent(DIAGRAM_ID, DIAGRAM_NAME, snapshot.nodes, snapshot.edges);
    this.exportJson.set(this.exporter.serialize(payload));
    this.showExport.set(true);
  }

  protected onImport(): void {
    this.showImport.set(true);
  }

  /** Exports the current canvas to a high-resolution PNG and downloads it. */
  protected async onExportPng(): Promise<void> {
    const blob = await this.adapter.exportPng();
    downloadBlob(blob, `${DIAGRAM_NAME}.png`);
  }

  /** Replaces the canvas with the first imported diagram, auto-arranged by dagre. */
  protected onImported(diagrams: ExportedDiagram[]): void {
    this.showImport.set(false);
    const first = diagrams[0];
    if (!first)
      return;
    const arranged = this.adapter.renderArrangedDiagram(first.nodes, first.edges);
    this.nodes.set([...arranged.nodes]);
    this.edges.set([...arranged.edges]);
    this.isEmpty.set(arranged.nodes.length === 0);
  }
}
