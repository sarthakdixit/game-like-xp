import { useCallback, useEffect, useState } from 'react';

import { getDb } from '@/data/db';
import type { NotificationClient } from '@/data/notificationClient';
import { getNotificationClient } from '@/data/notifications';
import { getDomainById } from '@/data/repositories/domainsRepository';
import { getQuestById } from '@/data/repositories/questsRepository';
import type { SqliteClient } from '@/data/sqliteClient';
import { getLocalDateString } from '@/domain/today';
import { syncQuestReminders } from '@/features/notifications/notificationService';

import {
  completeDailyQuestAndAwardXp,
  generateDailyQuests,
  type GenerateDailyQuestsOptions,
} from './dailyQuestsService';

export interface DailyQuestView {
  dailyQuestId: string;
  domainId: string;
  domainKey: string;
  domainName: string;
  text: string;
  xpReward: number;
  isBoss: boolean;
  completed: boolean;
}

export interface CompleteQuestResult {
  leveledUp: boolean;
  unlockedTitle: string | null;
}

export interface UseDailyQuestsResult {
  quests: DailyQuestView[];
  loading: boolean;
  error: Error | null;
  completeQuest: (dailyQuestId: string) => Promise<CompleteQuestResult | null>;
}

async function loadQuestViews(
  db: SqliteClient,
  date: string,
  selectionOptions?: GenerateDailyQuestsOptions,
): Promise<DailyQuestView[]> {
  const dailyQuests = await generateDailyQuests(db, date, selectionOptions);

  const views: DailyQuestView[] = [];
  for (const dailyQuest of dailyQuests) {
    const [quest, domain] = await Promise.all([
      getQuestById(db, dailyQuest.questId),
      getDomainById(db, dailyQuest.domainId),
    ]);
    if (!quest || !domain) {
      continue;
    }
    views.push({
      dailyQuestId: dailyQuest.id,
      domainId: domain.id,
      domainKey: domain.key,
      domainName: domain.name,
      text: quest.text,
      xpReward: quest.xpReward,
      isBoss: quest.isBoss,
      completed: dailyQuest.completedAt !== null,
    });
  }
  return views;
}

/**
 * Loads (and generates, if missing) today's 5 daily quests, enriched with
 * their template text/reward and owning domain. `completeQuest` awards XP
 * through the Batch 3 service, reloads the full list from the database, and
 * re-syncs the quest-reminder notifications against the fresh completion
 * status (so reminders stop once every quest is done).
 *
 * `selectionOptions` overrides the quest-selection randomness (for
 * deterministic tests only — production omits it). Pass a stable reference
 * (defined outside the component, or memoized) since it's an effect
 * dependency; a fresh object literal every render will re-trigger the load.
 */
export function useDailyQuests(
  dbFactory: () => Promise<SqliteClient> = getDb,
  date: string = getLocalDateString(),
  selectionOptions?: GenerateDailyQuestsOptions,
  notificationClientFactory: () => NotificationClient = getNotificationClient,
): UseDailyQuestsResult {
  const [quests, setQuests] = useState<DailyQuestView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await dbFactory();
      const views = await loadQuestViews(db, date, selectionOptions);
      setQuests(views);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      setLoading(false);
    }
  }, [dbFactory, date, selectionOptions]);

  useEffect(() => {
    void load();
  }, [load]);

  const completeQuest = useCallback(
    async (dailyQuestId: string): Promise<CompleteQuestResult | null> => {
      try {
        const db = await dbFactory();
        const result = await completeDailyQuestAndAwardXp(
          db,
          dailyQuestId,
          new Date().toISOString(),
        );

        const views = await loadQuestViews(db, date, selectionOptions);
        setQuests(views);
        setError(null);

        const allComplete = views.every((view) => view.completed);
        await syncQuestReminders(notificationClientFactory(), new Date(), allComplete);

        return { leveledUp: result.leveledUp, unlockedTitle: result.unlockedTitle };
      } catch (caught) {
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        return null;
      }
    },
    [dbFactory, date, selectionOptions, notificationClientFactory],
  );

  return { quests, loading, error, completeQuest };
}
