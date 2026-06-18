import { buildEdgeStyle, buildNodeStyle } from './node-style.factory';
import { PARALLELOGRAM_SHAPE } from './parallelogram-shape';
import { NodeType } from '../../shared/models/node.model';

describe('buildNodeStyle', () => {
  it('maps decision to a rhombus', () => {
    expect(buildNodeStyle('decision').shape).toBe('rhombus');
  });

  it('maps io to the parallelogram shape', () => {
    expect(buildNodeStyle('io').shape).toBe(PARALLELOGRAM_SHAPE);
  });

  it('maps terminal to a rounded rectangle', () => {
    const style = buildNodeStyle('terminal');
    expect(style.shape).toBe('rectangle');
    expect(style.rounded).toBe(true);
  });

  it('gives every node type a distinct fill color', () => {
    const types: NodeType[] = ['process', 'decision', 'terminal', 'io'];
    const fills = new Set(types.map(t => buildNodeStyle(t).fillColor));
    expect(fills.size).toBe(types.length);
  });
});

describe('buildEdgeStyle', () => {
  it('sets dashed only for dashed edges', () => {
    expect(buildEdgeStyle('dashed').dashed).toBe(true);
    expect(buildEdgeStyle('solid').dashed).toBe(false);
  });

  it('always uses a classic end arrow', () => {
    expect(buildEdgeStyle('solid').endArrow).toBe('classic');
  });
});
