export interface RadarChartAxis {
  key: string;
  label: string;
  value: number;
}

export interface Point {
  x: number;
  y: number;
}

export type LabelAnchor = 'start' | 'middle' | 'end';

export interface RadarAxisLayout {
  key: string;
  label: string;
  outer: Point;
  grid: Point;
  data: Point;
  labelPoint: Point;
  labelAnchor: LabelAnchor;
}

export interface RadarLayout {
  center: Point;
  radius: number;
  axes: RadarAxisLayout[];
}

function pointOnAxis(center: number, radius: number, index: number, count: number): Point {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

function labelAnchorFor(point: Point, center: number): LabelAnchor {
  const dx = point.x - center;
  if (dx > 8) {
    return 'start';
  }
  if (dx < -8) {
    return 'end';
  }
  return 'middle';
}

/**
 * Computes every point needed to draw an N-axis radar chart, purely from its
 * inputs. Values are clamped to `[0, maxValue]` before being placed on their axis.
 * Returns `null` below 3 axes, since a polygon needs at least a triangle.
 */
export function buildRadarLayout(
  axes: RadarChartAxis[],
  maxValue: number,
  size: number,
): RadarLayout | null {
  const count = axes.length;
  if (count < 3) {
    return null;
  }

  const centerValue = size / 2;
  const center: Point = { x: centerValue, y: centerValue };
  const radius = size * 0.32;
  const labelRadius = radius + size * 0.14;

  const layout: RadarAxisLayout[] = axes.map((axis, index) => {
    const clamped = Math.min(maxValue, Math.max(0, axis.value));
    const ratio = maxValue === 0 ? 0 : clamped / maxValue;
    const labelPoint = pointOnAxis(centerValue, labelRadius, index, count);

    return {
      key: axis.key,
      label: axis.label,
      outer: pointOnAxis(centerValue, radius, index, count),
      grid: pointOnAxis(centerValue, radius * 0.5, index, count),
      data: pointOnAxis(centerValue, radius * ratio, index, count),
      labelPoint,
      labelAnchor: labelAnchorFor(labelPoint, centerValue),
    };
  });

  return { center, radius, axes: layout };
}

export function pointsToString(points: Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}
