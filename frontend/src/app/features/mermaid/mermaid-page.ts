import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ExportDialog } from '../export-import/export-dialog';
import { ThemeToggle } from '../../shared/theme-toggle';
import { MermaidRenderService } from '../../core/mermaid/mermaid-render.service';
import { MermaidExportService } from '../../core/mermaid/mermaid-export.service';
import { extractMermaidCode } from '../../core/mermaid/mermaid-source';
import {
  DEFAULT_DIAGRAM_TYPE,
  MERMAID_DIAGRAM_TYPES,
  MermaidDiagramType,
  detectDiagramType
} from '../../core/mermaid/mermaid-diagram-types';
import { ThemeService } from '../../core/theme/theme.service';
import { readTextFile } from '../../shared/read-text-file';
import { svgStringToPng } from '../../shared/svg-to-png';
import { downloadBlob } from '../../shared/file-download';

const RENDER_DEBOUNCE_MS = 350;
const PNG_SCALE = 2;
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 10;
const FALLBACK_SIZE = { width: 1200, height: 800 };

/**
 * Mermaid workspace: a code editor with live preview, zoom, PNG export, LLM export (instructions +
 * fenced code) and file import. Separate from the maxGraph editor — this is the text-first flow.
 */
@Component({
  selector: 'app-mermaid-page',
  imports: [FormsModule, ExportDialog, ThemeToggle],
  templateUrl: './mermaid-page.html',
  styleUrl: './mermaid-page.css'
})
export class MermaidPage {
  private readonly renderer = inject(MermaidRenderService);
  private readonly exporter = inject(MermaidExportService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
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
    // Re-render with the matching mermaid theme whenever dark mode flips.
    effect(() => {
      this.theme.isDark();
      this.scheduleRender();
    });
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

  /** Full class string for a modality chip (active vs idle, light + dark) — keeps the template flat. */
  protected typeButtonClass(type: MermaidDiagramType): string {
    const base = 'rounded-full border px-3 py-1 text-sm';
    if (this.selectedType().id === type.id)
      return `${base} border-violet-400 bg-violet-100 text-violet-700 dark:border-violet-500 dark:bg-violet-900 dark:text-violet-200`;
    return `${base} border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600`;
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

  /**
   * Exports the current diagram as PNG. Always renders with the light theme so the file is readable
   * anywhere, regardless of the on-screen dark mode.
   */
  protected async exportPng(): Promise<void> {
    const svg = await this.renderer.renderToSvg(this.code(), 'default');
    const { width, height } = viewBoxSize(svg);
    const sized = withPixelSize(svg, width * PNG_SCALE, height * PNG_SCALE);
    const blob = await svgStringToPng(sized, width * PNG_SCALE, height * PNG_SCALE);
    downloadBlob(blob, 'diagrama-avancado.png');
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
      const svg = await this.renderer.renderToSvg(this.code(), this.theme.isDark() ? 'dark' : 'default');
      this.svg.set(this.sanitizer.bypassSecurityTrustHtml(svg));
      this.error.set('');
    } catch (cause) {
      this.error.set(cause instanceof Error ? cause.message : String(cause));
    }
  }
}

/** Reads the intrinsic drawing size from the SVG's viewBox attribute (e.g. "0 0 W H"). */
function viewBoxSize(svg: string): { width: number; height: number } {
  const match = /viewBox="([\d.\-\s]+)"/.exec(svg);
  const parts = match ? match[1].trim().split(/\s+/).map(Number) : [];
  if (parts.length === 4 && parts[2] > 0 && parts[3] > 0)
    return { width: parts[2], height: parts[3] };
  return { ...FALLBACK_SIZE };
}

/** Sets explicit width/height on the SVG markup so it rasterizes at the requested pixel size. */
function withPixelSize(svg: string, width: number, height: number): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  doc.documentElement.setAttribute('width', String(width));
  doc.documentElement.setAttribute('height', String(height));
  return new XMLSerializer().serializeToString(doc.documentElement);
}
