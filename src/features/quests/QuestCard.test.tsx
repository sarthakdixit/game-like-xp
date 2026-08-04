import { fireEvent, render, screen } from '@testing-library/react-native';

import type { DailyQuestView } from './useDailyQuests';
import { QuestCard } from './QuestCard';

const baseQuest: DailyQuestView = {
  dailyQuestId: 'dq-1',
  domainId: 'domain-1',
  domainKey: 'health',
  domainName: 'Health',
  text: 'Move for 20 minutes',
  xpReward: 15,
  isBoss: false,
  completed: false,
};

describe('QuestCard', () => {
  it('shows the quest text and xp reward', async () => {
    await render(<QuestCard quest={baseQuest} color="#7a1f1f" onToggle={jest.fn()} />);

    expect(screen.getByText('Move for 20 minutes')).toBeTruthy();
    expect(screen.getByText('+15xp')).toBeTruthy();
  });

  it('calls onToggle when pressed', async () => {
    const onToggle = jest.fn();
    await render(<QuestCard quest={baseQuest} color="#7a1f1f" onToggle={onToggle} />);

    fireEvent.press(screen.getByTestId('quest-card-health'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows a boss badge only for boss quests', async () => {
    await render(
      <QuestCard quest={{ ...baseQuest, isBoss: true }} color="#7a1f1f" onToggle={jest.fn()} />,
    );
    expect(screen.getByTestId('quest-card-health-boss')).toBeTruthy();
  });

  it('omits the boss badge for regular quests', async () => {
    await render(<QuestCard quest={baseQuest} color="#7a1f1f" onToggle={jest.fn()} />);
    expect(screen.queryByTestId('quest-card-health-boss')).toBeNull();
  });

  it('reflects the completed accessibility state', async () => {
    await render(
      <QuestCard quest={{ ...baseQuest, completed: true }} color="#7a1f1f" onToggle={jest.fn()} />,
    );
    expect(screen.getByTestId('quest-card-health').props.accessibilityState.checked).toBe(true);
  });
});
