import { render, screen } from '@testing-library/react-native';

import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';

import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('seeds an empty database and renders all 5 domains', async () => {
    const db = await createMigratedTestDb();

    await render(<HomeScreen dbFactory={() => Promise.resolve(db)} />);

    expect(screen.getByText('Chronicle')).toBeTruthy();
    for (const name of ['Health', 'Career', 'Relationships', 'Finance', 'Growth']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    expect(screen.getAllByTestId(/^domain-row-[a-z]+$/)).toHaveLength(5);
    expect(screen.queryByTestId('home-screen-loading')).toBeNull();
    expect(screen.queryByTestId('home-screen-error')).toBeNull();
  });

  it('renders the radar chart with one axis per domain', async () => {
    const db = await createMigratedTestDb();

    await render(<HomeScreen dbFactory={() => Promise.resolve(db)} />);

    expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(5);
  });

  it('shows an error state when the database fails to load', async () => {
    await render(<HomeScreen dbFactory={() => Promise.reject(new Error('boom'))} />);

    expect(screen.getByTestId('home-screen-error')).toBeTruthy();
    expect(screen.queryByTestId('domain-row-health')).toBeNull();
  });
});
