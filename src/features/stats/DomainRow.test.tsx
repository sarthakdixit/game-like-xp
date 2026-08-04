import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Domain } from '@/data/schema';

import { DomainRow } from './DomainRow';

function domain(overrides: Partial<Domain> = {}): Domain {
  return {
    id: 'health',
    key: 'health',
    name: 'Health',
    sortOrder: 0,
    level: 1,
    xp: 0,
    title: null,
    createdAt: '2026-08-04T00:00:00.000Z',
    ...overrides,
  };
}

describe('DomainRow', () => {
  it('shows the domain name and level', () => {
    render(<DomainRow domain={domain({ level: 4 })} />);

    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText(/Lv 4/)).toBeInTheDocument();
  });

  it('shows the stored title when one has been unlocked', () => {
    render(<DomainRow domain={domain({ level: 4, title: 'Adept' })} />);

    expect(screen.getByText(/Adept/)).toBeInTheDocument();
  });

  it('falls back to the level-derived title when none is stored yet', () => {
    render(<DomainRow domain={domain({ level: 1, title: null })} />);

    expect(screen.getByText(/Novice/)).toBeInTheDocument();
  });

  it('renders a distinct testid per domain key', () => {
    render(<DomainRow domain={domain({ key: 'career', name: 'Career' })} />);

    expect(screen.getByTestId('domain-row-career')).toBeInTheDocument();
  });
});
