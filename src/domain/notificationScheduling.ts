import { todayLocalDate } from './localDate';

function isSameLocalDay(a: Date, b: Date): boolean {
  return todayLocalDate(a) === todayLocalDate(b);
}

/** Local hour (0-23) at which a quest reminder becomes eligible to fire. */
export const DEFAULT_QUEST_REMINDER_HOUR = 18;

export interface QuestReminderInput {
  now: Date;
  completedCount: number;
  totalCount: number;
  /** ISO timestamp of the last time a quest reminder was actually shown, or `null` if never. */
  lastSentAt: string | null;
  /** Local hour (0-23) the reminder becomes eligible. Defaults to `DEFAULT_QUEST_REMINDER_HOUR`. */
  reminderHour?: number;
}

/**
 * Whether a daily-quest reminder should fire right now: only once per local
 * day, only once the reminder hour has passed, and only while quests remain
 * incomplete (finishing them all clears the need for a reminder).
 */
export function shouldSendQuestReminder(input: QuestReminderInput): boolean {
  const reminderHour = input.reminderHour ?? DEFAULT_QUEST_REMINDER_HOUR;

  if (input.totalCount === 0 || input.completedCount >= input.totalCount) {
    return false;
  }
  if (input.now.getHours() < reminderHour) {
    return false;
  }
  if (input.lastSentAt && isSameLocalDay(new Date(input.lastSentAt), input.now)) {
    return false;
  }
  return true;
}

export interface DecayNudgeInput {
  now: Date;
  /** Whether at least one domain currently has a decaying child stat. */
  hasDecayingDomain: boolean;
  /** ISO timestamp of the last time a decay nudge was actually shown, or `null` if never. */
  lastSentAt: string | null;
}

/**
 * Whether a decay/streak nudge should fire right now: only once per local
 * day, and only while something is actually decaying (no nudge to send once
 * everything's caught up).
 */
export function shouldSendDecayNudge(input: DecayNudgeInput): boolean {
  if (!input.hasDecayingDomain) {
    return false;
  }
  if (input.lastSentAt && isSameLocalDay(new Date(input.lastSentAt), input.now)) {
    return false;
  }
  return true;
}
