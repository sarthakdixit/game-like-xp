import { render, screen } from '@testing-library/react-native';

import { RadarChart } from './RadarChart';

const FIVE_AXES = [
  { key: 'health', label: 'Health', value: 72 },
  { key: 'career', label: 'Career', value: 55 },
  { key: 'relationships', label: 'Relationships', value: 40 },
  { key: 'finance', label: 'Finance', value: 30 },
  { key: 'growth', label: 'Growth', value: 60 },
];

describe('RadarChart', () => {
  it('renders one label element per axis, matching the given keys', async () => {
    await render(<RadarChart axes={FIVE_AXES} />);

    for (const axis of FIVE_AXES) {
      expect(screen.getByTestId(`radar-chart-label-${axis.key}`)).toBeTruthy();
    }
    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(5);
  });

  it('adapts to a different axis count (4 axes, e.g. a domain detail chart)', async () => {
    const fourAxes = [
      { key: 'fitness', label: 'Fitness', value: 65 },
      { key: 'nutrition', label: 'Nutrition', value: 45 },
      { key: 'sleep', label: 'Sleep', value: 55 },
      { key: 'mental', label: 'Mental wellbeing', value: 50 },
    ];

    await render(<RadarChart axes={fourAxes} />);

    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(4);
    expect(screen.getByTestId('radar-chart-data')).toBeTruthy();
  });

  it('renders a fallback with fewer than 3 axes instead of a malformed chart', async () => {
    await render(<RadarChart axes={[{ key: 'only', label: 'Only', value: 50 }]} />);

    expect(screen.getByTestId('radar-chart-empty')).toBeTruthy();
    expect(screen.queryByTestId('radar-chart-data')).toBeNull();
  });

  it('does not crash on an out-of-range value', async () => {
    const axes = [
      { key: 'a', label: 'A', value: 999 },
      { key: 'b', label: 'B', value: -20 },
      { key: 'c', label: 'C', value: 50 },
    ];

    await render(<RadarChart axes={axes} />);

    expect(screen.getByTestId('radar-chart-data')).toBeTruthy();
    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(3);
  });
});
