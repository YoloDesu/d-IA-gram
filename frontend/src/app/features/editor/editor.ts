import { Component, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { Canvas } from './canvas/canvas';
import { Toolbar } from './toolbar/toolbar';
import { DiagramList } from './diagram-list/diagram-list';
import { PropertiesPanel } from './properties-panel/properties-panel';
import { ExportDialog } from '../export-import/export-dialog';
import { ImportDialog } from '../export-import/import-dialog';
import { MaxGraphAdapterService } from '../../core/graph/maxgraph-adapter';
import { ProjectApiService } from '../../core/api/project-api';
import { DiagramApiService } from '../../core/api/diagram-api';
import { LlmExportService } from '../../core/export/llm-export.service';
import { ExportedDiagram } from '../../core/export/llm-format.types';
import { Diagram } from '../../shared/models/diagram.model';
import { DiagramNode, NodeType } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';
import { DiagramSnapshot, SelectedCellInfo } from '../../core/graph/graph-events';

/**
 * Editor shell: diagram list (left) + canvas (center) + properties panel (right),
 * with a toolbar on top. Owns its MaxGraphAdapterService so each editor has one graph.
 * Edits flow canvas → snapshot → debounced auto-save.
 */
@Component({
  selector: 'app-editor',
  imports: [Canvas, Toolbar, DiagramList, PropertiesPanel, ExportDialog, ImportDialog],
  templateUrl: './editor.html',
  styleUrl: './editor.css',
  providers: [MaxGraphAdapterService]
})
export class Editor implements OnInit {
  private readonly adapter = inject(MaxGraphAdapterService);
  private readonly projectApi = inject(ProjectApiService);
  private readonly diagramApi = inject(DiagramApiService);
  private readonly exporter = inject(LlmExportService);
  private readonly router = inject(Router);
  private readonly saveQueue = new Subject<DiagramSnapshot>();

  readonly projectId = input.required<string>();

  protected readonly projectName = signal('');
  protected readonly diagrams = signal<Diagram[]>([]);
  protected readonly selectedDiagramId = signal<string | null>(null);
  protected readonly nodes = signal<readonly DiagramNode[]>([]);
  protected readonly edges = signal<readonly DiagramEdge[]>([]);
  protected readonly selectedCell = signal<SelectedCellInfo | null>(null);
  protected readonly saving = signal(false);
  protected readonly exportJson = signal('');
  protected readonly showExport = signal(false);
  protected readonly showImport = signal(false);

  constructor() {
    this.saveQueue.pipe(
      debounceTime(600),
      switchMap(snapshot => this.persist(snapshot)),
      takeUntilDestroyed()
    ).subscribe({
      next: () => this.saving.set(false),
      error: () => this.saving.set(false)
    });
  }

  ngOnInit(): void {
    this.projectApi.get(this.projectId()).subscribe(p => this.projectName.set(p.name));
    this.loadDiagrams();
  }

  protected onCreateDiagram(name: string): void {
    this.diagramApi.create(this.projectId(), { name }).subscribe(created => {
      this.diagrams.update(list => [...list, created]);
      this.openDiagram(created);
    });
  }

  protected onSelectDiagram(id: string): void {
    if (id === this.selectedDiagramId())
      return;
    this.diagramApi.get(this.projectId(), id).subscribe(diagram => this.openDiagram(diagram));
  }

  protected onAddNode(type: NodeType): void {
    if (this.selectedDiagramId())
      this.adapter.insertNode(type);
  }

  protected onDeleteSelected(): void {
    this.adapter.deleteSelection();
  }

  protected onLabelChanged(label: string): void {
    this.adapter.updateSelectedLabel(label);
  }

  protected onSnapshot(snapshot: DiagramSnapshot): void {
    this.saving.set(true);
    this.saveQueue.next(snapshot);
  }

  protected onSelection(cell: SelectedCellInfo | null): void {
    this.selectedCell.set(cell);
  }

  protected onExport(): void {
    const id = this.selectedDiagramId();
    if (!id)
      return;
    const name = this.diagrams().find(d => d.id === id)?.name ?? 'Diagrama';
    const snapshot = this.adapter.snapshot();
    const payload = this.exporter.buildFromCurrent(id, name, snapshot.nodes, snapshot.edges);
    this.exportJson.set(this.exporter.serialize(payload));
    this.showExport.set(true);
  }

  protected onImport(): void {
    this.showImport.set(true);
  }

  /** Replaces the current diagram's content with the first imported diagram, then saves. */
  protected onImported(diagrams: ExportedDiagram[]): void {
    this.showImport.set(false);
    const first = diagrams[0];
    if (!this.selectedDiagramId() || !first)
      return;
    this.nodes.set([...first.nodes]);
    this.edges.set([...first.edges]);
    this.saving.set(true);
    this.saveQueue.next({ nodes: [...first.nodes], edges: [...first.edges] });
  }

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  private loadDiagrams(): void {
    this.diagramApi.list(this.projectId()).subscribe(diagrams => {
      this.diagrams.set(diagrams);
      if (diagrams.length > 0)
        this.openDiagram(diagrams[0]);
    });
  }

  private openDiagram(diagram: Diagram): void {
    this.selectedDiagramId.set(diagram.id);
    this.selectedCell.set(null);
    this.nodes.set(diagram.nodes);
    this.edges.set(diagram.edges);
  }

  private persist(snapshot: DiagramSnapshot) {
    const diagramId = this.selectedDiagramId();
    const diagram = this.diagrams().find(d => d.id === diagramId);
    const name = diagram?.name ?? 'Diagrama';
    return this.diagramApi.save(this.projectId(), diagramId!, {
      name,
      nodes: snapshot.nodes,
      edges: snapshot.edges
    });
  }
}
