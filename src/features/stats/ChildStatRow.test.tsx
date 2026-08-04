import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ChildStatDisplay } from './useDomainDetail';

import { ChildStatRow } from './ChildStatRow';

function stat(overrides: Partial<ChildStatDisplay> = {}): ChildStatDisplay {
  return {
    id: 'fitness',
    key: 'fitness',
    name: 'Fitness',
    sortOrder: 0,
    displayValue: 65,
    isDecaying: false,
    ...overrides,
  };
}

describe('ChildStatRow', () => {
  it('shows the name and value', () => {
    render(<ChildStatRow stat={stat({ name: 'Fitness', displayValue: 65 })} />);

    expect(screen.getByText('Fitness')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('shows no decay note for a fresh stat', () => {
    render(<ChildStatRow stat={stat({ isDecaying: false })} />);

    expect(screen.queryByText('decaying')).not.toBeInTheDocument();
  });

  it('shows a decaying note for a stat that is losing value', () => {
    render(<ChildStatRow stat={stat({ isDecaying: true })} />);

    expect(screen.getByText('decaying')).toBeInTheDocument();
  });

  it('renders a distinct testid per stat key', () => {
    render(<ChildStatRow stat={stat({ key: 'sleep', name: 'Sleep' })} />);

    expect(screen.getByTestId('child-stat-row-sleep')).toBeInTheDocument();
  });
});
