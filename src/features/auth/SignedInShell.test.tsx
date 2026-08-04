import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SignedInShell } from './SignedInShell';

describe('SignedInShell', () => {
  it('shows the display name when available', () => {
    render(
      <SignedInShell
        user={{ uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null }}
        onSignOut={vi.fn()}
      />,
    );

    expect(screen.getByText('Signed in as Ada Lovelace')).toBeInTheDocument();
  });

  it('falls back to email when display name is missing', () => {
    render(
      <SignedInShell
        user={{ uid: 'abc', displayName: null, email: 'ada@example.com', photoURL: null }}
        onSignOut={vi.fn()}
      />,
    );

    expect(screen.getByText('Signed in as ada@example.com')).toBeInTheDocument();
  });

  it('falls back to uid when display name and email are both missing', () => {
    render(
      <SignedInShell
        user={{ uid: 'abc-123', displayName: null, email: null, photoURL: null }}
        onSignOut={vi.fn()}
      />,
    );

    expect(screen.getByText('Signed in as abc-123')).toBeInTheDocument();
  });

  it('calls onSignOut when the button is clicked', () => {
    const onSignOut = vi.fn();
    render(
      <SignedInShell
        user={{ uid: 'abc', displayName: 'Ada Lovelace', email: 'ada@example.com', photoURL: null }}
        onSignOut={onSignOut}
      />,
    );

    screen.getByText('Sign out').click();

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
