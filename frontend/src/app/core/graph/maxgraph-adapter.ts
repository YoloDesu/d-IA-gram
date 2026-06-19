import { Injectable } from '@angular/core';
import {
  Cell,
  getDefaultPlugins,
  Graph,
  HierarchicalLayout,
  InternalEvent,
  PanningHandler,
  Point,
  RubberBandHandler
} from '@maxgraph/core';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { DiagramNode, NodeType } from '../../shared/models/node.model';
import { DiagramEdge } from '../../shared/models/edge.model';
import { buildEdgeStyle, buildNodeStyle } from './node-style.factory';
import { registerParallelogramShape } from './parallelogram-shape';
import { cellToEdge, cellToNode } from './graph-cell-mapper';
import { buildEdgeWaypoints } from './edge-router';
import { DEFAULT_NODE_SIZE, DiagramSnapshot, EditorTool, SelectedCellInfo } from './graph-events';

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
    this.graph = new Graph(container, undefined, [...getDefaultPlugins(), RubberBandHandler]);
    this.graph.getStylesheet().putDefaultEdgeStyle(buildEdgeStyle('solid'));
    this.setInteractionMode('select');
    this.attachListeners(this.graph);
  }

  /** Switches between selection/area-selection and left-button canvas panning. */
  setInteractionMode(mode: EditorTool): void {
    const graph = this.require();
    const panMode = mode === 'pan';
    graph.setPanning(panMode);
    graph.setConnectable(!panMode);
    graph.setCellsSelectable(!panMode);
    graph.setCellsMovable(!panMode);
    graph.getPlugin<RubberBandHandler>('RubberBandHandler')?.setEnabled(!panMode);
    configureLeftButtonPanning(graph, panMode);
    graph.container.classList.toggle('is-pan-mode', panMode);
    graph.container.classList.toggle('is-select-mode', !panMode);
    if (panMode)
      graph.clearSelection();
  }

  /** Replaces all cells with the given diagram. Does not emit a change event. */
  renderDiagram(nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]): void {
    const graph = this.require();
    this.isRendering = true;
    try {
      graph.batchUpdate(() => {
        this.replaceDiagramCells(graph, nodes, edges);
        this.routeEdgesAroundNodes(graph);
      });
    } finally {
      this.isRendering = false;
    }
  }

  /** Renders an imported diagram, applies a top-to-bottom hierarchy, and returns the new state. */
  renderHierarchicalDiagram(nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]): DiagramSnapshot {
    const graph = this.require();
    this.isRendering = true;
    try {
      graph.batchUpdate(() => {
        this.replaceDiagramCells(graph, nodes, edges);
        buildImportedHierarchyLayout(graph).execute(graph.getDefaultParent());
        this.routeEdgesAroundNodes(graph);
      });
    } finally {
      this.isRendering = false;
    }
    return this.snapshot();
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

  /** Removes every node and edge from the current diagram. */
  clearDiagram(): void {
    const graph = this.require();
    graph.removeCells(graph.getChildCells(graph.getDefaultParent(), true, true));
  }

  /** Zooms into the canvas. */
  zoomIn(): void {
    this.require().zoomIn();
  }

  /** Zooms out of the canvas. */
  zoomOut(): void {
    this.require().zoomOut();
  }

  /** Restores the canvas to 100% zoom. */
  resetZoom(): void {
    this.require().zoomActual();
  }

  /**
   * Renders the current diagram to a high-resolution PNG. The SVG is vector, so rasterizing
   * at `scale`× the content bounds yields a crisp image regardless of the on-screen zoom.
   */
  async exportPng(scale = 3, padding = 16): Promise<Blob> {
    const graph = this.require();
    const svg = graph.container.querySelector('svg');
    if (!svg)
      throw new Error('MaxGraphAdapterService: SVG do grafo não encontrado para exportar PNG.');
    const bounds = graph.getGraphBounds();
    const width = Math.max(1, Math.ceil(bounds.width) + padding * 2);
    const height = Math.max(1, Math.ceil(bounds.height) + padding * 2);
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', String(width * scale));
    clone.setAttribute('height', String(height * scale));
    clone.setAttribute('viewBox', `${bounds.x - padding} ${bounds.y - padding} ${width} ${height}`);
    const xml = new XMLSerializer().serializeToString(clone);
    return rasterizeSvg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`, width * scale, height * scale);
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

  private replaceDiagramCells(graph: Graph, nodes: readonly DiagramNode[], edges: readonly DiagramEdge[]): void {
    graph.removeCells(graph.getChildCells(graph.getDefaultParent(), true, true));
    const cellsById = this.insertNodes(graph, nodes);
    this.insertEdges(graph, edges, cellsById);
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

  private routeEdgesAroundNodes(graph: Graph): void {
    const parent = graph.getDefaultParent();
    const nodes = graph.getChildVertices(parent).map(cellToNode).filter((node): node is DiagramNode => node !== null);
    for (const edgeCell of graph.getChildEdges(parent)) {
      const edge = cellToEdge(edgeCell);
      if (edge)
        this.setEdgeWaypoints(graph, edgeCell, buildEdgeWaypoints(nodes, edge));
    }
  }

  private setEdgeWaypoints(graph: Graph, edgeCell: Cell, waypoints: readonly { x: number; y: number }[]): void {
    const geometry = edgeCell.getGeometry()?.clone();
    if (!geometry)
      return;
    geometry.points = waypoints.length > 0 ? waypoints.map(point => new Point(point.x, point.y)) : null;
    graph.getDataModel().setGeometry(edgeCell, geometry);
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

function buildImportedHierarchyLayout(graph: Graph): HierarchicalLayout {
  const layout = new HierarchicalLayout(graph, 'north');
  layout.intraCellSpacing = 90;
  layout.interRankCellSpacing = 130;
  layout.interHierarchySpacing = 100;
  layout.parallelEdgeSpacing = 18;
  return layout;
}

function configureLeftButtonPanning(graph: Graph, enabled: boolean): void {
  const panning = graph.getPlugin<PanningHandler>('PanningHandler');
  if (!panning)
    return;
  panning.useLeftButtonForPanning = enabled;
  panning.ignoreCell = enabled;
}

/** Draws an SVG data URL onto a white canvas of the given pixel size and returns a PNG blob. */
function rasterizeSvg(svgDataUrl: string, width: number, height: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Contexto 2D indisponível para exportar PNG.'));
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao gerar o PNG.')), 'image/png');
    };
    image.onerror = () => reject(new Error('Falha ao rasterizar o SVG do diagrama.'));
    image.src = svgDataUrl;
  });
}
