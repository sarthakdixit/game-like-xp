import { fireEvent, render, screen } from '@testing-library/react-native';

import type { Domain } from '@/data/schema';

import { DomainRow } from './DomainRow';

const baseDomain: Domain = {
  id: 'domain-1',
  key: 'health',
  name: 'Health',
  sortOrder: 0,
  level: 4,
  xp: 650,
  title: 'Adept',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('DomainRow', () => {
  it('shows the domain name, level, and title', async () => {
    await render(<DomainRow domain={baseDomain} />);

    expect(screen.getByText('Health')).toBeTruthy();
    expect(screen.getByText('Lv 4 · Adept')).toBeTruthy();
  });

  it('omits the title separator when there is no title yet', async () => {
    await render(<DomainRow domain={{ ...baseDomain, title: null }} />);

    expect(screen.getByText('Lv 4')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<DomainRow domain={baseDomain} onPress={onPress} />);

    fireEvent.press(screen.getByTestId('domain-row-health'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
