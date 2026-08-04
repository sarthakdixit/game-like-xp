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
const VIEWBOX_PADDING = 40; // generous margin so axis labels never clip

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
        <text
          key={label.key}
          data-testid={`radar-chart-label-${label.key}`}
          x={label.x}
          y={label.y}
          textAnchor={label.anchor}
          fontSize={10}
          fill="var(--ink-soft)"
          style={{ fontVariant: 'small-caps' }}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}
