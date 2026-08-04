import { describe, expect, it } from 'vitest';

import {
  DEFAULT_QUEST_REMINDER_HOUR,
  shouldSendDecayNudge,
  shouldSendQuestReminder,
} from './notificationScheduling';

describe('shouldSendQuestReminder', () => {
  const EVENING = new Date(2026, 7, 4, DEFAULT_QUEST_REMINDER_HOUR, 0, 0);
  const MORNING = new Date(2026, 7, 4, DEFAULT_QUEST_REMINDER_HOUR - 1, 0, 0);

  it('does not fire before the reminder hour', () => {
    expect(
      shouldSendQuestReminder({
        now: MORNING,
        completedCount: 0,
        totalCount: 5,
        lastSentAt: null,
      }),
    ).toBe(false);
  });

  it('fires at or after the reminder hour when quests remain', () => {
    expect(
      shouldSendQuestReminder({
        now: EVENING,
        completedCount: 2,
        totalCount: 5,
        lastSentAt: null,
      }),
    ).toBe(true);
  });

  it('does not fire once every quest is complete', () => {
    expect(
      shouldSendQuestReminder({
        now: EVENING,
        completedCount: 5,
        totalCount: 5,
        lastSentAt: null,
      }),
    ).toBe(false);
  });

  it('does not fire when there are no quests at all', () => {
    expect(
      shouldSendQuestReminder({
        now: EVENING,
        completedCount: 0,
        totalCount: 0,
        lastSentAt: null,
      }),
    ).toBe(false);
  });

  it('does not fire twice on the same local day', () => {
    const lastSentAt = new Date(2026, 7, 4, DEFAULT_QUEST_REMINDER_HOUR, 5, 0).toISOString();

    expect(
      shouldSendQuestReminder({
        now: EVENING,
        completedCount: 2,
        totalCount: 5,
        lastSentAt,
      }),
    ).toBe(false);
  });

  it('fires again on a new local day even if it already fired yesterday', () => {
    const yesterday = new Date(2026, 7, 3, DEFAULT_QUEST_REMINDER_HOUR, 5, 0).toISOString();

    expect(
      shouldSendQuestReminder({
        now: EVENING,
        completedCount: 2,
        totalCount: 5,
        lastSentAt: yesterday,
      }),
    ).toBe(true);
  });

  it('honors a custom reminder hour', () => {
    const noon = new Date(2026, 7, 4, 12, 0, 0);

    expect(
      shouldSendQuestReminder({
        now: noon,
        completedCount: 0,
        totalCount: 5,
        lastSentAt: null,
        reminderHour: 12,
      }),
    ).toBe(true);
  });
});

describe('shouldSendDecayNudge', () => {
  const NOW = new Date(2026, 7, 4, 9, 0, 0);

  it('does not fire when nothing is decaying', () => {
    expect(shouldSendDecayNudge({ now: NOW, hasDecayingDomain: false, lastSentAt: null })).toBe(
      false,
    );
  });

  it('fires when something is decaying and it has not fired today', () => {
    expect(shouldSendDecayNudge({ now: NOW, hasDecayingDomain: true, lastSentAt: null })).toBe(
      true,
    );
  });

  it('does not fire twice on the same local day', () => {
    const lastSentAt = new Date(2026, 7, 4, 8, 0, 0).toISOString();

    expect(shouldSendDecayNudge({ now: NOW, hasDecayingDomain: true, lastSentAt })).toBe(false);
  });

  it('fires again on a new local day', () => {
    const yesterday = new Date(2026, 7, 3, 9, 0, 0).toISOString();

    expect(shouldSendDecayNudge({ now: NOW, hasDecayingDomain: true, lastSentAt: yesterday })).toBe(
      true,
    );
  });
});
