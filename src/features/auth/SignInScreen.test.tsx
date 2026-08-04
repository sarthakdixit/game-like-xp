import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SignInScreen } from './SignInScreen';

describe('SignInScreen', () => {
  it('calls onSignIn when the button is clicked', () => {
    const onSignIn = vi.fn();
    render(<SignInScreen onSignIn={onSignIn} />);

    screen.getByText('Sign in with Google').click();

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when one is passed', () => {
    render(<SignInScreen onSignIn={vi.fn()} error={new Error('popup blocked')} />);

    expect(screen.getByTestId('sign-in-error')).toHaveTextContent('popup blocked');
  });

  it('shows no error message when none is passed', () => {
    render(<SignInScreen onSignIn={vi.fn()} />);

    expect(screen.queryByTestId('sign-in-error')).not.toBeInTheDocument();
  });
});
