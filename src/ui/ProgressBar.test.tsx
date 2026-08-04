import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders the fill at the correct percentage width', () => {
    render(<ProgressBar value={40} testId="bar" />);

    expect(screen.getByTestId('bar-fill')).toHaveStyle({ width: '40%' });
  });

  it('scales relative to a custom maxValue', () => {
    render(<ProgressBar value={5} maxValue={10} testId="bar" />);

    expect(screen.getByTestId('bar-fill')).toHaveStyle({ width: '50%' });
  });

  it('clamps a value above maxValue to 100%', () => {
    render(<ProgressBar value={150} testId="bar" />);

    expect(screen.getByTestId('bar-fill')).toHaveStyle({ width: '100%' });
  });

  it('clamps a negative value to 0%', () => {
    render(<ProgressBar value={-20} testId="bar" />);

    expect(screen.getByTestId('bar-fill')).toHaveStyle({ width: '0%' });
  });

  it('does not divide by zero when maxValue is 0', () => {
    render(<ProgressBar value={10} maxValue={0} testId="bar" />);

    expect(screen.getByTestId('bar-fill')).toHaveStyle({ width: '0%' });
  });

  it('uses the default gold color when none is provided', () => {
    render(<ProgressBar value={50} testId="bar" />);

    expect(screen.getByTestId('bar-fill')).toHaveStyle({ backgroundColor: 'var(--gold)' });
  });

  it('uses a custom color when provided', () => {
    render(<ProgressBar value={50} color="var(--dom-health)" testId="bar" />);

    expect(screen.getByTestId('bar-fill')).toHaveStyle({ backgroundColor: 'var(--dom-health)' });
  });
});
