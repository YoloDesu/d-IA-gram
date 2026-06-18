import { Injectable } from '@angular/core';
import { Cell, Graph, InternalEvent } from '@maxgraph/core';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { DiagramNode, NodeType } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';
import { buildEdgeStyle, buildNodeStyle } from './node-style.factory';
import { registerParallelogramShape } from './parallelogram-shape';
import { cellToEdge, cellToNode } from './graph-cell-mapper';
import { DEFAULT_NODE_SIZE, DiagramSnapshot, SelectedCellInfo } from './graph-events';

/**
 * Thin interface owning maxGraph. The rest of the app only sees DiagramNode/DiagramEdge
 * and the change/selection observables — never a maxGraph type. Provide this at the
 * editor component level so each editor gets its own graph (CLAUDE.md: wrap third-party libs).
 */
@Injectable()
export class MaxGraphAdapterService {
  private graph: Graph | null = null;
  private isRendering = false;
  private insertOffset = 0;
  private readonly changes = new Subject<DiagramSnapshot>();
  private readonly selection = new Subject<SelectedCellInfo | null>();

  /** Emits the full diagram state whenever the user edits the canvas. */
  get changes$(): Observable<DiagramSnapshot> {
    return this.changes.asObservable();
  }

  /** Emits the selected cell (or null when cleared). */
  get selection$(): Observable<SelectedCellInfo | null> {
    return this.selection.asObservable();
  }

  initializeGraph(container: HTMLElement): void {
    registerParallelogramShape();
    this.graph = new Graph(container);
    this.graph.setPanning(true);
    this.graph.setConnectable(true);
    this.graph.getStylesheet().putDefaultEdgeStyle(buildEdgeStyle('solid'));
    this.attachListeners(this.graph);
  }

  /** Replaces all cells with the given diagram. Does not emit a change event. */
  renderDiagram(nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]): void {
    const graph = this.require();
    this.isRendering = true;
    graph.batchUpdate(() => {
      graph.removeCells(graph.getChildCells(graph.getDefaultParent(), true, true));
      const cellsById = this.insertNodes(graph, nodes);
      this.insertEdges(graph, edges, cellsById);
    });
    this.isRendering = false;
  }

  /** Inserts a new node of the given type at a cascading position. Emits a change. */
  insertNode(type: NodeType): void {
    const graph = this.require();
    const size = DEFAULT_NODE_SIZE[type];
    const offset = (this.insertOffset = (this.insertOffset + 1) % 8);
    graph.insertVertex({
      parent: graph.getDefaultParent(),
      id: uuidv4(),
      value: this.defaultLabel(type),
      position: [60 + offset * 24, 60 + offset * 24],
      size: [size.width, size.height],
      style: buildNodeStyle(type)
    });
  }

  /** Current diagram state read back from the graph. */
  snapshot(): DiagramSnapshot {
    const graph = this.require();
    const parent = graph.getDefaultParent();
    const nodes = graph.getChildVertices(parent)
      .map(cellToNode)
      .filter((node): node is DiagramNode => node !== null);
    const edges = graph.getChildEdges(parent)
      .map(cellToEdge)
      .filter((edge): edge is DiagramEdge => edge !== null);
    return { nodes, edges };
  }

  /** Sets the label of the currently selected cell. */
  updateSelectedLabel(label: string): void {
    const graph = this.require();
    const cell = graph.getSelectionCell();
    if (cell)
      graph.getDataModel().setValue(cell, label);
  }

  /** Removes the selected cell(s) from the diagram. */
  deleteSelection(): void {
    const graph = this.require();
    graph.removeCells(graph.getSelectionCells());
  }

  destroyGraph(): void {
    this.graph?.destroy();
    this.graph = null;
    this.changes.complete();
    this.selection.complete();
  }

  private insertNodes(graph: Graph, nodes: readonly DiagramNode[]): Map<string, Cell> {
    const cellsById = new Map<string, Cell>();
    for (const node of nodes) {
      const cell = graph.insertVertex({
        parent: graph.getDefaultParent(),
        id: node.id,
        value: node.label,
        position: [node.position.x, node.position.y],
        size: [node.size.width, node.size.height],
        style: buildNodeStyle(node.type)
      });
      cellsById.set(node.id, cell);
    }
    return cellsById;
  }

  private insertEdges(
    graph: Graph,
    edges: readonly DiagramEdge[],
    cellsById: Map<string, Cell>
  ): void {
    for (const edge of edges) {
      const source = cellsById.get(edge.sourceNodeId);
      const target = cellsById.get(edge.targetNodeId);
      if (!source || !target)
        continue;
      graph.insertEdge({
        parent: graph.getDefaultParent(),
        id: edge.id,
        value: edge.label ?? '',
        source,
        target,
        style: buildEdgeStyle(edge.lineStyle)
      });
    }
  }

  private attachListeners(graph: Graph): void {
    graph.getDataModel().addListener(InternalEvent.CHANGE, () => this.onModelChange());
    graph.getSelectionModel().addListener(InternalEvent.CHANGE, () => this.onSelectionChange(graph));
  }

  private onModelChange(): void {
    if (!this.isRendering)
      this.changes.next(this.snapshot());
  }

  private onSelectionChange(graph: Graph): void {
    const cell = graph.getSelectionCells()[0];
    this.selection.next(cell ? this.describeSelection(cell) : null);
  }

  private describeSelection(cell: Cell): SelectedCellInfo {
    return {
      id: cell.id ?? '',
      kind: cell.isEdge() ? 'edge' : 'node',
      label: typeof cell.value === 'string' ? cell.value : ''
    };
  }

  private defaultLabel(type: NodeType): string {
    const labels: Record<NodeType, string> = {
      process: 'Processo',
      decision: 'Decisão?',
      terminal: 'Início',
      io: 'Entrada/Saída'
    };
    return labels[type];
  }

  private require(): Graph {
    if (!this.graph)
      throw new Error('MaxGraphAdapterService: graph not initialized. Call initializeGraph first.');
    return this.graph;
  }
}
