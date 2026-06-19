import { DiagramEdge } from '../../shared/models/edge.model';
import { DiagramNode } from '../../shared/models/node.model';

const DETOUR_MARGIN = 36;
const OBSTACLE_MARGIN = 10;

export interface EdgeWaypoint {
  readonly x: number;
  readonly y: number;
}

interface NodeBox {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Builds edge control points that detour around node boxes when a direct route would cross them. */
export function buildEdgeWaypoints(nodes: readonly DiagramNode[], edge: DiagramEdge): readonly EdgeWaypoint[] {
  const boxes = nodes.map(nodeToBox);
  const source = boxes.find(box => box.id === edge.sourceNodeId);
  const target = boxes.find(box => box.id === edge.targetNodeId);
  if (!source || !target || source.id === target.id)
    return [];
  const obstacles = boxes.filter(box => box.id !== source.id && box.id !== target.id);
  if (!sameRow(source, target) && !routeHitsAny(center(source), center(target), obstacles))
    return [];
  return chooseRoute(source, target, boxes, obstacles);
}

function chooseRoute(
  source: NodeBox,
  target: NodeBox,
  boxes: readonly NodeBox[],
  obstacles: readonly NodeBox[]
): readonly EdgeWaypoint[] {
  const routes = sameRow(source, target)
    ? horizontalDetourCandidates(source, target, boxes)
    : verticalDetourCandidates(source, target, boxes);
  return routes.sort((first, second) => compareRoutes(first, second, source, target, obstacles))[0] ?? [];
}

function horizontalDetourCandidates(source: NodeBox, target: NodeBox, boxes: readonly NodeBox[]): EdgeWaypoint[][] {
  const above = combinedRowBoundary([source, target], boxes, 'above');
  const below = combinedRowBoundary([source, target], boxes, 'below');
  return [above, below].map(y => [{ x: center(source).x, y }, { x: center(target).x, y }]);
}

function verticalDetourCandidates(source: NodeBox, target: NodeBox, boxes: readonly NodeBox[]): EdgeWaypoint[][] {
  const down = center(target).y >= center(source).y;
  const sourceY = rowBoundary(source, boxes, down ? 'below' : 'above');
  const targetY = rowBoundary(target, boxes, down ? 'above' : 'below');
  return sideLanes(source, target, boxes)
    .map(x => [{ x: center(source).x, y: sourceY }, { x, y: sourceY }, { x, y: targetY }, { x: center(target).x, y: targetY }]);
}

function compareRoutes(
  first: readonly EdgeWaypoint[],
  second: readonly EdgeWaypoint[],
  source: NodeBox,
  target: NodeBox,
  obstacles: readonly NodeBox[]
): number {
  const firstHits = routeHitCount(first, source, target, obstacles);
  const secondHits = routeHitCount(second, source, target, obstacles);
  return firstHits - secondHits || routeLength(first, source, target) - routeLength(second, source, target);
}

function routeHitCount(
  waypoints: readonly EdgeWaypoint[],
  source: NodeBox,
  target: NodeBox,
  obstacles: readonly NodeBox[]
): number {
  const points = [center(source), ...waypoints, center(target)];
  return segments(points).reduce((count, segment) => count + hitCount(segment, obstacles), 0);
}

function hitCount(segment: readonly [EdgeWaypoint, EdgeWaypoint], obstacles: readonly NodeBox[]): number {
  return obstacles.filter(box => segmentHitsBox(segment[0], segment[1], expandBox(box))).length;
}

function routeLength(waypoints: readonly EdgeWaypoint[], source: NodeBox, target: NodeBox): number {
  return segments([center(source), ...waypoints, center(target)])
    .reduce((sum, segment) => sum + distance(segment[0], segment[1]), 0);
}

function routeHitsAny(start: EdgeWaypoint, end: EdgeWaypoint, boxes: readonly NodeBox[]): boolean {
  return boxes.some(box => segmentHitsBox(start, end, expandBox(box)));
}

function segments(points: readonly EdgeWaypoint[]): readonly [EdgeWaypoint, EdgeWaypoint][] {
  return points.slice(1).map((point, index) => [points[index], point]);
}

function sideLanes(source: NodeBox, target: NodeBox, boxes: readonly NodeBox[]): readonly number[] {
  const left = Math.min(...boxes.map(box => box.x)) - DETOUR_MARGIN;
  const right = Math.max(...boxes.map(box => box.x + box.width)) + DETOUR_MARGIN;
  return center(target).x >= center(source).x ? [right, left] : [left, right];
}

function rowBoundary(box: NodeBox, boxes: readonly NodeBox[], side: 'above' | 'below'): number {
  return combinedRowBoundary([box], boxes, side);
}

function combinedRowBoundary(subjects: readonly NodeBox[], boxes: readonly NodeBox[], side: 'above' | 'below'): number {
  const row = boxes.filter(box => subjects.some(subject => verticalRangesOverlap(subject, box)));
  const edge = side === 'above'
    ? Math.min(...row.map(box => box.y)) - DETOUR_MARGIN
    : Math.max(...row.map(box => box.y + box.height)) + DETOUR_MARGIN;
  return Math.round(edge);
}

function sameRow(first: NodeBox, second: NodeBox): boolean {
  return verticalRangesOverlap(first, second);
}

function verticalRangesOverlap(first: NodeBox, second: NodeBox): boolean {
  return first.y < second.y + second.height && first.y + first.height > second.y;
}

function segmentHitsBox(start: EdgeWaypoint, end: EdgeWaypoint, box: NodeBox): boolean {
  if (pointInside(start, box) || pointInside(end, box))
    return true;
  return boxEdges(box).some(edge => segmentsIntersect(start, end, edge[0], edge[1]));
}

function boxEdges(box: NodeBox): readonly [EdgeWaypoint, EdgeWaypoint][] {
  const topLeft = { x: box.x, y: box.y };
  const topRight = { x: box.x + box.width, y: box.y };
  const bottomRight = { x: box.x + box.width, y: box.y + box.height };
  const bottomLeft = { x: box.x, y: box.y + box.height };
  return [[topLeft, topRight], [topRight, bottomRight], [bottomRight, bottomLeft], [bottomLeft, topLeft]];
}

function segmentsIntersect(a: EdgeWaypoint, b: EdgeWaypoint, c: EdgeWaypoint, d: EdgeWaypoint): boolean {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

function ccw(a: EdgeWaypoint, b: EdgeWaypoint, c: EdgeWaypoint): boolean {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

function pointInside(point: EdgeWaypoint, box: NodeBox): boolean {
  return point.x > box.x && point.x < box.x + box.width && point.y > box.y && point.y < box.y + box.height;
}

function center(box: NodeBox): EdgeWaypoint {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function distance(first: EdgeWaypoint, second: EdgeWaypoint): number {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

function expandBox(box: NodeBox): NodeBox {
  return { id: box.id, x: box.x - OBSTACLE_MARGIN, y: box.y - OBSTACLE_MARGIN,
    width: box.width + OBSTACLE_MARGIN * 2, height: box.height + OBSTACLE_MARGIN * 2 };
}

function nodeToBox(node: DiagramNode): NodeBox {
  return { id: node.id, x: node.position.x, y: node.position.y, width: node.size.width, height: node.size.height };
}
