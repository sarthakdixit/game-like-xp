export interface RadarAxis {
  key: string;
  label: string;
  /** 0-100; clamped into that range if it falls outside. */
  value: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface RadarLabel extends Point {
  key: string;
  text: string;
  anchor: 'start' | 'middle' | 'end';
}

export interface RadarGeometryConfig {
  axes: RadarAxis[];
  center?: Point;
  /** Outer radius, in the same units as `center`. */
  radius?: number;
  /** Background grid ring radii, as fractions of `radius` (e.g. [0.5, 1]). */
  gridRings?: number[];
  /** How far beyond `radius` axis labels sit, as a fraction of `radius`. */
  labelOffset?: number;
}

export interface RadarGeometry {
  center: Point;
  radius: number;
  /** One polygon (array of points) per entry in `gridRings`. */
  gridPolygons: Point[][];
  /** One spoke line (center to outer edge) per axis. */
  spokes: { from: Point; to: Point }[];
  /** The actual data polygon, one point per axis. */
  dataPolygon: Point[];
  /** One label per axis, positioned just outside the outer ring. */
  labels: RadarLabel[];
}

const DEFAULT_CENTER: Point = { x: 100, y: 100 };
const DEFAULT_RADIUS = 80;
const DEFAULT_GRID_RINGS = [0.5, 1];
const DEFAULT_LABEL_OFFSET = 1.18;

/** First axis points straight up; each subsequent axis advances clockwise. */
function axisAngleRadians(index: number, count: number): number {
  const degrees = -90 + (360 / count) * index;
  return (degrees * Math.PI) / 180;
}

function pointAt(center: Point, radius: number, angle: number, ratio: number): Point {
  return {
    x: center.x + Math.cos(angle) * radius * ratio,
    y: center.y + Math.sin(angle) * radius * ratio,
  };
}

/** Text anchor so a label reads away from the chart rather than over it. */
function anchorForAngle(angle: number): RadarLabel['anchor'] {
  const NEAR_VERTICAL_THRESHOLD = 0.15;
  const cos = Math.cos(angle);
  if (Math.abs(cos) < NEAR_VERTICAL_THRESHOLD) {
    return 'middle';
  }
  return cos > 0 ? 'start' : 'end';
}

function clampValue(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Pure geometry for an N-axis radar chart (N >= 3), data-driven entirely
 * from `axes` — nothing here knows about domains, child stats, or any
 * specific label set. Separated from the rendering component because SVG
 * shape elements collapse to opaque native nodes under most test renderers,
 * so the actual math needs to be independently testable.
 */
export function computeRadarGeometry(config: RadarGeometryConfig): RadarGeometry {
  const { axes } = config;
  if (axes.length < 3) {
    throw new Error(`A radar chart needs at least 3 axes, got ${axes.length}`);
  }

  const center = config.center ?? DEFAULT_CENTER;
  const radius = config.radius ?? DEFAULT_RADIUS;
  const gridRings = config.gridRings ?? DEFAULT_GRID_RINGS;
  const labelOffset = config.labelOffset ?? DEFAULT_LABEL_OFFSET;

  const count = axes.length;
  const angles = axes.map((_, index) => axisAngleRadians(index, count));

  const gridPolygons = gridRings.map((ringRatio) =>
    angles.map((angle) => pointAt(center, radius, angle, ringRatio)),
  );

  const spokes = angles.map((angle) => ({
    from: center,
    to: pointAt(center, radius, angle, 1),
  }));

  const dataPolygon = axes.map((axis, index) =>
    pointAt(center, radius, angles[index], clampValue(axis.value) / 100),
  );

  const labels: RadarLabel[] = axes.map((axis, index) => {
    const position = pointAt(center, radius, angles[index], labelOffset);
    return {
      key: axis.key,
      text: axis.label,
      x: position.x,
      y: position.y,
      anchor: anchorForAngle(angles[index]),
    };
  });

  return { center, radius, gridPolygons, spokes, dataPolygon, labels };
}
