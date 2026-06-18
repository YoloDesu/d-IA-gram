import { Shape, ShapeRegistry } from '@maxgraph/core';

/** Style name under which the I/O parallelogram is registered in maxGraph. */
export const PARALLELOGRAM_SHAPE = 'parallelogram';

/**
 * Flowchart I/O shape. maxGraph 0.23 ships no built-in parallelogram, so we draw one:
 * a rectangle skewed horizontally by 25% of its width (classic input/output symbol).
 */
class ParallelogramShape extends Shape {
  override paintVertexShape(
    canvas: AbstractCanvas2DLike,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const skew = Math.min(width * 0.25, height);
    canvas.begin();
    canvas.moveTo(x + skew, y);
    canvas.lineTo(x + width, y);
    canvas.lineTo(x + width - skew, y + height);
    canvas.lineTo(x, y + height);
    canvas.close();
    canvas.fillAndStroke();
  }
}

/** Minimal surface of maxGraph's canvas we rely on (avoids importing the internal type). */
interface AbstractCanvas2DLike {
  begin(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  close(): void;
  fillAndStroke(): void;
}

/** Idempotently registers the parallelogram shape. Safe to call on every graph init. */
export function registerParallelogramShape(): void {
  if (!ShapeRegistry.get(PARALLELOGRAM_SHAPE))
    ShapeRegistry.add(PARALLELOGRAM_SHAPE, ParallelogramShape as never);
}
