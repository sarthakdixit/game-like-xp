import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { QuestDisplay } from './useDailyQuests';
import { QuestCard } from './QuestCard';

function makeQuest(overrides: Partial<QuestDisplay> = {}): QuestDisplay {
  return {
    dailyQuestId: 'daily-1',
    domainId: 'health',
    domainKey: 'health',
    domainName: 'Health',
    text: 'Take a 15-minute walk',
    xpReward: 15,
    isBoss: false,
    completed: false,
    ...overrides,
  };
}

describe('QuestCard', () => {
  it('renders the quest text and xp reward', () => {
    render(<QuestCard quest={makeQuest()} onComplete={vi.fn()} />);

    expect(screen.getByText('Take a 15-minute walk')).toBeInTheDocument();
    expect(screen.getByText('+15xp')).toBeInTheDocument();
  });

  it('renders an unchecked checkbox for an incomplete quest', () => {
    render(<QuestCard quest={makeQuest()} onComplete={vi.fn()} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).not.toBeDisabled();
  });

  it('renders a checked, disabled checkbox for a completed quest', () => {
    render(<QuestCard quest={makeQuest({ completed: true })} onComplete={vi.fn()} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox).toBeDisabled();
  });

  it('calls onComplete with the daily quest id when the checkbox is clicked', () => {
    const onComplete = vi.fn();
    render(<QuestCard quest={makeQuest({ dailyQuestId: 'daily-42' })} onComplete={onComplete} />);

    screen.getByRole('checkbox').click();

    expect(onComplete).toHaveBeenCalledWith('daily-42');
  });

  it('renders a boss flag only for a boss quest', () => {
    const { rerender } = render(
      <QuestCard quest={makeQuest({ isBoss: false })} onComplete={vi.fn()} />,
    );
    expect(screen.queryByText('Boss')).not.toBeInTheDocument();

    rerender(<QuestCard quest={makeQuest({ isBoss: true })} onComplete={vi.fn()} />);
    expect(screen.getByText('Boss')).toBeInTheDocument();
  });

  it('gives the checkbox an accessible label naming the quest', () => {
    render(
      <QuestCard
        quest={makeQuest({ text: 'Drink 6 glasses of water today' })}
        onComplete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('checkbox', { name: /Drink 6 glasses of water today/ }),
    ).toBeInTheDocument();
  });
});
