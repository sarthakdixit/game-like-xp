import { computeRadarGeometry } from './radarGeometry';

export interface RadarChartAxisInput {
  key: string;
  label: string;
  value: number;
}

export interface RadarChartProps {
  axes: RadarChartAxisInput[];
  /** Data polygon fill/stroke color — any valid CSS color, including a `var(--...)` reference. */
  color?: string;
}

const CHART_SIZE = 200; // matches radarGeometry's default center (100,100) / radius 80
// Labels wrap inside a fixed-width box (see LABEL_BOX_WIDTH) instead of running out as a single
// line, so this only needs to fit that box — not an arbitrarily long axis label.
const VIEWBOX_PADDING = 66;
const LABEL_BOX_WIDTH = 64;
const LABEL_BOX_HEIGHT = 34;

const TEXT_ALIGN_FOR_ANCHOR: Record<'start' | 'middle' | 'end', 'left' | 'center' | 'right'> = {
  start: 'left',
  middle: 'center',
  end: 'right',
};

/** Left edge of the label's wrapping box, given where its text should anchor. */
function labelBoxX(anchorX: number, anchor: 'start' | 'middle' | 'end'): number {
  if (anchor === 'start') {
    return anchorX;
  }
  if (anchor === 'end') {
    return anchorX - LABEL_BOX_WIDTH;
  }
  return anchorX - LABEL_BOX_WIDTH / 2;
}

/**
 * Generic, data-driven N-axis radar chart — nothing here is hardcoded to
 * specific domain or child-stat names, per the Batch 5 requirement. Renders
 * as plain SVG (not a canvas or a chart library) so it stays lightweight
 * and themeable via CSS custom properties.
 */
export function RadarChart({ axes, color = 'var(--gold)' }: RadarChartProps) {
  const geometry = computeRadarGeometry({ axes });
  const viewBoxOrigin = -VIEWBOX_PADDING;
  const viewBoxSize = CHART_SIZE + VIEWBOX_PADDING * 2;
  const outerRingIndex = geometry.gridPolygons.length - 1;

  return (
    <svg
      viewBox={`${viewBoxOrigin} ${viewBoxOrigin} ${viewBoxSize} ${viewBoxSize}`}
      style={{ width: '100%', overflow: 'visible' }}
      role="img"
      aria-label="Stat radar chart"
    >
      {geometry.gridPolygons.map((ring, index) => (
        <polygon
          key={index}
          points={ring.map((point) => `${point.x},${point.y}`).join(' ')}
          fill="none"
          stroke={index === outerRingIndex ? '#00000030' : '#00000022'}
          strokeWidth={1}
        />
      ))}

      {geometry.spokes.map((spoke, index) => (
        <line
          key={index}
          x1={spoke.from.x}
          y1={spoke.from.y}
          x2={spoke.to.x}
          y2={spoke.to.y}
          stroke="#00000025"
          strokeWidth={1}
        />
      ))}

      <polygon
        points={geometry.dataPolygon.map((point) => `${point.x},${point.y}`).join(' ')}
        fill={color}
        fillOpacity={0.35}
        stroke={color}
        strokeWidth={1.5}
      />

      {geometry.labels.map((label) => (
        <foreignObject
          key={label.key}
          x={labelBoxX(label.x, label.anchor)}
          y={label.y - LABEL_BOX_HEIGHT / 2}
          width={LABEL_BOX_WIDTH}
          height={LABEL_BOX_HEIGHT}
          style={{ overflow: 'visible' }}
        >
          <div
            data-testid={`radar-chart-label-${label.key}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: TEXT_ALIGN_FOR_ANCHOR[label.anchor],
              height: '100%',
              fontSize: 10,
              lineHeight: 1.2,
              color: 'var(--ink-soft)',
              fontVariant: 'small-caps',
              textAlign: TEXT_ALIGN_FOR_ANCHOR[label.anchor],
              wordBreak: 'break-word',
            }}
          >
            {label.text}
          </div>
        </foreignObject>
      ))}
    </svg>
  );
}
