import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ExportDialog } from '../export-import/export-dialog';
import { MermaidRenderService } from '../../core/mermaid/mermaid-render.service';
import { MermaidExportService } from '../../core/mermaid/mermaid-export.service';
import { extractMermaidCode } from '../../core/mermaid/mermaid-source';
import {
  DEFAULT_DIAGRAM_TYPE,
  MERMAID_DIAGRAM_TYPES,
  MermaidDiagramType,
  detectDiagramType
} from '../../core/mermaid/mermaid-diagram-types';
import { readTextFile } from '../../shared/read-text-file';
import { svgStringToPng } from '../../shared/svg-to-png';
import { downloadBlob } from '../../shared/file-download';

const RENDER_DEBOUNCE_MS = 350;
const PNG_SCALE = 2;
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 6;

/**
 * Mermaid workspace: a code editor with live preview, zoom, PNG export, LLM export (instructions +
 * fenced code) and file import. Separate from the maxGraph editor — this is the text-first flow.
 */
@Component({
  selector: 'app-mermaid-page',
  imports: [FormsModule, ExportDialog],
  templateUrl: './mermaid-page.html',
  styleUrl: './mermaid-page.css'
})
export class MermaidPage {
  private readonly renderer = inject(MermaidRenderService);
  private readonly exporter = inject(MermaidExportService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly preview = viewChild.required<ElementRef<HTMLDivElement>>('preview');
  private renderTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly types = MERMAID_DIAGRAM_TYPES;
  protected readonly selectedType = signal<MermaidDiagramType>(DEFAULT_DIAGRAM_TYPE);
  protected readonly code = signal(DEFAULT_DIAGRAM_TYPE.sample);
  protected readonly svg = signal<SafeHtml>('');
  protected readonly error = signal('');
  protected readonly zoom = signal(1);
  protected readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));
  protected readonly exportText = signal('');
  protected readonly showExport = signal(false);
  protected readonly isPanning = signal(false);
  private panOrigin = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

  constructor() {
    void this.render();
  }

  /** Click-drag panning of the preview, so very large flows can be navigated without scrollbars. */
  protected onPanStart(event: PointerEvent): void {
    const surface = event.currentTarget as HTMLElement;
    this.panOrigin = { x: event.clientX, y: event.clientY, scrollLeft: surface.scrollLeft, scrollTop: surface.scrollTop };
    this.isPanning.set(true);
    surface.setPointerCapture(event.pointerId);
  }

  protected onPanMove(event: PointerEvent): void {
    if (!this.isPanning())
      return;
    const surface = event.currentTarget as HTMLElement;
    surface.scrollLeft = this.panOrigin.scrollLeft - (event.clientX - this.panOrigin.x);
    surface.scrollTop = this.panOrigin.scrollTop - (event.clientY - this.panOrigin.y);
  }

  protected onPanEnd(event: PointerEvent): void {
    if (!this.isPanning())
      return;
    this.isPanning.set(false);
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  }

  protected onCodeChange(code: string): void {
    this.code.set(code);
    this.scheduleRender();
  }

  /** Loads a modality's starter diagram so the user discovers the available formats. */
  protected selectType(type: MermaidDiagramType): void {
    this.selectedType.set(type);
    this.code.set(type.sample);
    void this.render();
  }

  protected zoomIn(): void {
    this.zoom.update(value => Math.min(ZOOM_MAX, value + ZOOM_STEP));
  }

  protected zoomOut(): void {
    this.zoom.update(value => Math.max(ZOOM_MIN, value - ZOOM_STEP));
  }

  protected resetZoom(): void {
    this.zoom.set(1);
  }

  protected openExport(): void {
    this.exportText.set(this.exporter.buildExport(this.code(), this.selectedType()));
    this.showExport.set(true);
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file)
      return;
    const code = extractMermaidCode(await readTextFile(file));
    this.code.set(code);
    this.selectedType.set(detectDiagramType(code) ?? this.selectedType());
    await this.render();
  }

  /** Rasterizes the rendered SVG (at its intrinsic viewBox size × scale) to a downloadable PNG. */
  protected async exportPng(): Promise<void> {
    const svgEl = this.preview().nativeElement.querySelector('svg');
    if (!svgEl)
      return;
    const { width, height } = svgIntrinsicSize(svgEl);
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', String(width * PNG_SCALE));
    clone.setAttribute('height', String(height * PNG_SCALE));
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = await svgStringToPng(xml, width * PNG_SCALE, height * PNG_SCALE);
    downloadBlob(blob, 'diagrama-mermaid.png');
  }

  protected goBack(): void {
    this.router.navigate(['/']);
  }

  private scheduleRender(): void {
    if (this.renderTimer)
      clearTimeout(this.renderTimer);
    this.renderTimer = setTimeout(() => void this.render(), RENDER_DEBOUNCE_MS);
  }

  private async render(): Promise<void> {
    try {
      const svg = await this.renderer.renderToSvg(this.code());
      this.svg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
      this.error.set('');
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    }
  }
}

/** Reads the SVG's drawing size from its viewBox, falling back to the rendered box. */
function svgIntrinsicSize(svg: SVGSVGElement): { width: number; height: number } {
  const box = svg.viewBox?.baseVal;
  if (box && box.width > 0 && box.height > 0)
    return { width: box.width, height: box.height };
  const rect = svg.getBoundingClientRect();
  return { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
}
