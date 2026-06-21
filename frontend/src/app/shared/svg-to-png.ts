/**
 * Rasterizes SVG to PNG in the browser. Shared by the maxGraph canvas export and the Mermaid
 * page export so the white-background + canvas drawing logic lives in one place.
 */

/** Draws an SVG data URL onto a white canvas of the given pixel size and returns a PNG blob. */
export function rasterizeSvg(svgDataUrl: string, width: number, height: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image();
    image.onload = () => drawOntoCanvas(image, width, height, resolve, reject);
    image.onerror = () => reject(new Error('Falha ao rasterizar o SVG do diagrama.'));
    image.src = svgDataUrl;
  });
}

/** Serializes an SVG markup string to a PNG blob at the given pixel size. */
export function svgStringToPng(svg: string, width: number, height: number): Promise<Blob> {
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return rasterizeSvg(dataUrl, width, height);
}

function drawOntoCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  resolve: (blob: Blob) => void,
  reject: (error: Error) => void
): void {
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
}
