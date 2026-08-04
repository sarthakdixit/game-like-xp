import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { computeRadarGeometry } from './radarGeometry';
import { RadarChart } from './RadarChart';

const FIVE_AXES = [
  { key: 'health', label: 'Health', value: 80 },
  { key: 'career', label: 'Career', value: 60 },
  { key: 'relationships', label: 'Relationships', value: 40 },
  { key: 'finance', label: 'Finance', value: 30 },
  { key: 'growth', label: 'Growth', value: 70 },
];

describe('RadarChart', () => {
  it('renders exactly one label per axis', () => {
    render(<RadarChart axes={FIVE_AXES} />);

    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(5);
  });

  it('renders each label with its own axis text', () => {
    render(<RadarChart axes={FIVE_AXES} />);

    for (const axis of FIVE_AXES) {
      expect(screen.getByTestId(`radar-chart-label-${axis.key}`)).toHaveTextContent(axis.label);
    }
  });

  it('adapts cleanly to a different axis count (4 axes)', () => {
    const fourAxes = [
      { key: 'a', label: 'A', value: 50 },
      { key: 'b', label: 'B', value: 50 },
      { key: 'c', label: 'C', value: 50 },
      { key: 'd', label: 'D', value: 50 },
    ];

    render(<RadarChart axes={fourAxes} />);

    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(4);
  });

  it('adapts cleanly to 3 axes (the minimum)', () => {
    const threeAxes = [
      { key: 'a', label: 'A', value: 50 },
      { key: 'b', label: 'B', value: 50 },
      { key: 'c', label: 'C', value: 50 },
    ];

    render(<RadarChart axes={threeAxes} />);

    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(3);
  });

  it('renders the data polygon with points computed purely from the axis values', () => {
    const { container } = render(<RadarChart axes={FIVE_AXES} />);

    const expectedGeometry = computeRadarGeometry({ axes: FIVE_AXES });
    const expectedPoints = expectedGeometry.dataPolygon.map((p) => `${p.x},${p.y}`).join(' ');

    const polygons = container.querySelectorAll('polygon');
    const dataPolygon = polygons[polygons.length - 1]; // grid rings render first, data polygon last
    expect(dataPolygon).toHaveAttribute('points', expectedPoints);
  });

  it('re-renders the data polygon when a value prop changes', () => {
    const lowValue = [
      { key: 'a', label: 'A', value: 10 },
      { key: 'b', label: 'B', value: 10 },
      { key: 'c', label: 'C', value: 10 },
    ];
    const highValue = [
      { key: 'a', label: 'A', value: 90 },
      { key: 'b', label: 'B', value: 90 },
      { key: 'c', label: 'C', value: 90 },
    ];

    const { container, rerender } = render(<RadarChart axes={lowValue} />);
    const polygonsBefore = container.querySelectorAll('polygon');
    const pointsBefore = polygonsBefore[polygonsBefore.length - 1].getAttribute('points');

    rerender(<RadarChart axes={highValue} />);
    const polygonsAfter = container.querySelectorAll('polygon');
    const pointsAfter = polygonsAfter[polygonsAfter.length - 1].getAttribute('points');

    expect(pointsAfter).not.toBe(pointsBefore);
  });

  it('uses the default gold color when none is provided', () => {
    const { container } = render(<RadarChart axes={FIVE_AXES} />);

    const polygons = container.querySelectorAll('polygon');
    const dataPolygon = polygons[polygons.length - 1];
    expect(dataPolygon).toHaveAttribute('fill', 'var(--gold)');
  });

  it('uses a custom color when provided', () => {
    const { container } = render(<RadarChart axes={FIVE_AXES} color="var(--dom-health)" />);

    const polygons = container.querySelectorAll('polygon');
    const dataPolygon = polygons[polygons.length - 1];
    expect(dataPolygon).toHaveAttribute('fill', 'var(--dom-health)');
    expect(dataPolygon).toHaveAttribute('stroke', 'var(--dom-health)');
  });
});
