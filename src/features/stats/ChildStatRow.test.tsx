import { render, screen } from '@testing-library/react-native';

import type { DisplayChildStat } from './useDomainDetail';
import { ChildStatRow } from './ChildStatRow';

const baseStat: DisplayChildStat = {
  id: 'stat-1',
  domainId: 'domain-1',
  key: 'fitness',
  name: 'Fitness',
  sortOrder: 0,
  value: 65,
  lastActiveAt: '2026-08-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  displayValue: 65,
  isDecaying: false,
};

describe('ChildStatRow', () => {
  it('shows the stat name and rounded value', async () => {
    await render(<ChildStatRow stat={baseStat} />);

    expect(screen.getByText('Fitness')).toBeTruthy();
    expect(screen.getByText('65')).toBeTruthy();
  });

  it('shows a decaying note when the stat is currently decaying', async () => {
    await render(<ChildStatRow stat={{ ...baseStat, displayValue: 55, isDecaying: true }} />);

    expect(screen.getByTestId('child-stat-row-fitness-decaying')).toBeTruthy();
  });

  it('omits the decaying note when not decaying', async () => {
    await render(<ChildStatRow stat={baseStat} />);

    expect(screen.queryByTestId('child-stat-row-fitness-decaying')).toBeNull();
  });

  it('rounds a fractional display value', async () => {
    await render(<ChildStatRow stat={{ ...baseStat, displayValue: 54.7 }} />);

    expect(screen.getByText('55')).toBeTruthy();
  });
});
