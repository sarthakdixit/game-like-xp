import { View } from 'react-native';
import Svg, { Line, Polygon, Text as SvgText } from 'react-native-svg';

import { buildRadarLayout, pointsToString, type RadarChartAxis } from './radarGeometry';
import { colors } from './theme';

export type { RadarChartAxis };

export interface RadarChartProps {
  axes: RadarChartAxis[];
  maxValue?: number;
  size?: number;
  color?: string;
}

/** A data-driven N-axis radar/spider chart. Renders a placeholder below 3 axes. */
export function RadarChart({
  axes,
  maxValue = 100,
  size = 220,
  color = colors.gold,
}: RadarChartProps) {
  const layout = buildRadarLayout(axes, maxValue, size);

  if (!layout) {
    return <View testID="radar-chart-empty" style={{ width: size, height: size }} />;
  }

  const { canvasSize, center, axes: axisLayout } = layout;
  const outerPoints = pointsToString(axisLayout.map((a) => a.outer));
  const gridPoints = pointsToString(axisLayout.map((a) => a.grid));
  const dataPoints = pointsToString(axisLayout.map((a) => a.data));

  return (
    <Svg
      testID="radar-chart"
      width={canvasSize}
      height={canvasSize}
      viewBox={`0 0 ${canvasSize} ${canvasSize}`}
    >
      <Polygon
        points={outerPoints}
        fill="none"
        stroke={colors.inkSoft}
        strokeOpacity={0.3}
        strokeWidth={1}
      />
      <Polygon
        points={gridPoints}
        fill="none"
        stroke={colors.inkSoft}
        strokeOpacity={0.2}
        strokeWidth={1}
      />
      {axisLayout.map((axis) => (
        <Line
          key={axis.key}
          x1={center.x}
          y1={center.y}
          x2={axis.outer.x}
          y2={axis.outer.y}
          stroke={colors.inkSoft}
          strokeOpacity={0.25}
          strokeWidth={1}
        />
      ))}
      <Polygon
        testID="radar-chart-data"
        points={dataPoints}
        fill={color}
        fillOpacity={0.35}
        stroke={color}
        strokeWidth={1.5}
      />
      {axisLayout.map((axis) => (
        <SvgText
          key={axis.key}
          testID={`radar-chart-label-${axis.key}`}
          x={axis.labelPoint.x}
          y={axis.labelPoint.y}
          fontSize={11}
          fill={colors.inkSoft}
          textAnchor={axis.labelAnchor}
        >
          {axis.label}
        </SvgText>
      ))}
    </Svg>
  );
}
