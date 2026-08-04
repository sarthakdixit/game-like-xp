import { fireEvent, render, screen } from '@testing-library/react-native';

import { createChildStat } from '@/data/repositories/childStatsRepository';
import { createDomain, updateDomainProgress } from '@/data/repositories/domainsRepository';
import { createMigratedTestDb } from '@/data/testUtils/nodeSqliteClient';
import type { SqliteClient } from '@/data/sqliteClient';

import { DomainDetailScreen } from './DomainDetailScreen';

async function seedDomainWithChildStats(childCount: 3 | 4 | 5) {
  const db = await createMigratedTestDb();
  const domain = await createDomain(db, { key: 'health', name: 'Health', sortOrder: 0 });
  await updateDomainProgress(db, domain.id, { level: 4, xp: 650, title: 'Adept' });

  const names = ['Fitness', 'Nutrition', 'Sleep', 'Mental wellbeing', 'Hydration'];
  const now = new Date().toISOString();
  for (let i = 0; i < childCount; i += 1) {
    await createChildStat(db, {
      domainId: domain.id,
      key: names[i].toLowerCase().replace(/\s+/g, '_'),
      name: names[i],
      sortOrder: i,
      value: 50 + i * 5,
      lastActiveAt: now,
    });
  }

  return { db, domainId: domain.id };
}

describe('DomainDetailScreen', () => {
  it.each([3, 4, 5] as const)(
    'renders a %i-axis radar chart matching the child stat count',
    async (count) => {
      const { db, domainId } = await seedDomainWithChildStats(count);

      await render(
        <DomainDetailScreen
          domainId={domainId}
          dbFactory={() => Promise.resolve(db as SqliteClient)}
        />,
      );

      expect(screen.getAllByTestId(/^radar-chart-label-/)).toHaveLength(count);
      expect(screen.getAllByTestId(/^child-stat-row-/)).toHaveLength(count);
    },
  );

  it('shows the domain level, title, and xp progress', async () => {
    const { db, domainId } = await seedDomainWithChildStats(4);

    await render(<DomainDetailScreen domainId={domainId} dbFactory={() => Promise.resolve(db)} />);

    expect(screen.getByText('Health · level 4')).toBeTruthy();
    expect(screen.getByText('Adept')).toBeTruthy();
    expect(screen.getByText('650xp')).toBeTruthy();
  });

  it('calls onBack when the floating back button is pressed', async () => {
    const { db, domainId } = await seedDomainWithChildStats(3);
    const onBack = jest.fn();

    await render(
      <DomainDetailScreen
        domainId={domainId}
        dbFactory={() => Promise.resolve(db)}
        onBack={onBack}
      />,
    );
    fireEvent.press(screen.getByTestId('domain-detail-back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('shows an error state for a domain that does not exist', async () => {
    const db = await createMigratedTestDb();

    await render(<DomainDetailScreen domainId="missing" dbFactory={() => Promise.resolve(db)} />);

    expect(screen.getByTestId('domain-detail-error')).toBeTruthy();
  });
});
