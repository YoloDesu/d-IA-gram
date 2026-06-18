import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  viewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { DiagramNode } from '../../../shared/models/node.model';
import { DiagramEdge } from '../../../shared/models/edge.model';
import { MaxGraphAdapterService } from '../../../core/graph/maxgraph-adapter';
import { DiagramSnapshot, SelectedCellInfo } from '../../../core/graph/graph-events';

/**
 * Renders a diagram via maxGraph and bridges the imperative graph events into Angular
 * outputs. The `nodes`/`edges` inputs are the *initial* state — the canvas owns state
 * while editing, so parents should only reassign them on load/import (not on auto-save).
 */
@Component({
  selector: 'app-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.css'
})
export class Canvas implements AfterViewInit, OnDestroy {
  private readonly adapter = inject(MaxGraphAdapterService);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('graphContainer');
  private readonly subscriptions = new Subscription();
  private ready = false;

  readonly nodes = input<readonly DiagramNode[]>([]);
  readonly edges = input<readonly DiagramEdge[]>([]);
  readonly snapshotChanged = output<DiagramSnapshot>();
  readonly selectionChanged = output<SelectedCellInfo | null>();

  constructor() {
    effect(() => {
      const nodes = this.nodes();
      const edges = this.edges();
      if (this.ready)
        this.adapter.renderDiagram(nodes, edges);
    });
  }

  ngAfterViewInit(): void {
    this.adapter.initializeGraph(this.container().nativeElement);
    this.subscriptions.add(this.adapter.changes$.subscribe(s => this.snapshotChanged.emit(s)));
    this.subscriptions.add(this.adapter.selection$.subscribe(c => this.selectionChanged.emit(c)));
    this.ready = true;
    this.adapter.renderDiagram(this.nodes(), this.edges());
  }

  /** Deletes the selected cell with Delete/Backspace, unless the user is typing in a field. */
  @HostListener('document:keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Delete' && event.key !== 'Backspace')
      return;
    if (isTextInput(event.target))
      return;
    event.preventDefault();
    this.adapter.deleteSelection();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.adapter.destroyGraph();
  }
}

function isTextInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement))
    return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}
