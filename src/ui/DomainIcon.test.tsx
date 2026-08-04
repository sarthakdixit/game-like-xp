import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DomainIcon } from './DomainIcon';

describe('DomainIcon', () => {
  it('renders a distinct icon for each known domain key', () => {
    const keys = ['health', 'career', 'relationships', 'finance', 'growth'];
    const markups = keys.map((key) => {
      const { container } = render(<DomainIcon domainKey={key} />);
      return container.innerHTML;
    });

    expect(new Set(markups).size).toBe(keys.length);
  });

  it('falls back to a generic icon for an unrecognized domain key', () => {
    const { container } = render(<DomainIcon domainKey="unknown" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('circle')).toBeInTheDocument();
  });

  it('marks the icon as decorative for screen readers', () => {
    const { container } = render(<DomainIcon domainKey="health" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
