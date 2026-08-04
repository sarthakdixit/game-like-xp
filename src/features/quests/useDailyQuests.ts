import { useCallback, useEffect, useState } from 'react';

import { getDomainById, listDomains } from '@/data/repositories/domainsRepository';
import { getQuestById } from '@/data/repositories/questsRepository';
import type { FirestoreClient } from '@/data/firestoreClient';
import { getFirestoreClient } from '@/data/firestore';
import { todayLocalDate } from '@/domain/localDate';

import { completeDailyQuestAndAwardXp, generateDailyQuests } from './dailyQuestsService';

export interface QuestDisplay {
  dailyQuestId: string;
  domainId: string;
  domainKey: string;
  domainName: string;
  text: string;
  xpReward: number;
  isBoss: boolean;
  completed: boolean;
}

export interface LevelUpAnnouncement {
  domainName: string;
  level: number;
  unlockedTitle: string | null;
}

export interface UseDailyQuestsResult {
  quests: QuestDisplay[];
  completedCount: number;
  totalCount: number;
  loading: boolean;
  error: Error | null;
  levelUp: LevelUpAnnouncement | null;
  completeQuest: (dailyQuestId: string) => Promise<void>;
  dismissLevelUp: () => void;
}

/**
 * Loads (generating if needed) today's daily quests joined with their quest
 * template text/xp/boss flag and owning domain name/key, and exposes
 * `completeQuest` wired through the Batch 4 service layer. `firestoreClientFactory`
 * defaults to the real Firebase-backed client; tests inject a fake instead.
 */
export function useDailyQuests(
  uid: string,
  firestoreClientFactory: () => FirestoreClient = getFirestoreClient,
): UseDailyQuestsResult {
  const [quests, setQuests] = useState<QuestDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [levelUp, setLevelUp] = useState<LevelUpAnnouncement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const client = firestoreClientFactory();
        const today = todayLocalDate();
        const domains = await listDomains(client, uid);
        const domainById = new Map(domains.map((domain) => [domain.id, domain]));
        const dailyQuests = await generateDailyQuests(client, uid, today);

        const display: QuestDisplay[] = [];
        for (const dailyQuest of dailyQuests) {
          const domain = domainById.get(dailyQuest.domainId);
          const quest = await getQuestById(client, uid, dailyQuest.questId);
          if (!domain || !quest) {
            continue;
          }
          display.push({
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
        display.sort(
          (a, b) => domainById.get(a.domainId)!.sortOrder - domainById.get(b.domainId)!.sortOrder,
        );

        if (!cancelled) {
          setQuests(display);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught : new Error(String(caught)));
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [uid, firestoreClientFactory]);

  const completeQuest = useCallback(
    async (dailyQuestId: string) => {
      const target = quests.find((quest) => quest.dailyQuestId === dailyQuestId);
      if (!target || target.completed) {
        return;
      }

      const client = firestoreClientFactory();
      const result = await completeDailyQuestAndAwardXp(
        client,
        uid,
        dailyQuestId,
        new Date().toISOString(),
      );

      setQuests((prev) =>
        prev.map((quest) =>
          quest.dailyQuestId === dailyQuestId ? { ...quest, completed: true } : quest,
        ),
      );

      if (result.leveledUp) {
        const domain = await getDomainById(client, uid, target.domainId);
        if (domain) {
          setLevelUp({
            domainName: target.domainName,
            level: domain.level,
            unlockedTitle: result.unlockedTitle,
          });
        }
      }
    },
    [quests, uid, firestoreClientFactory],
  );

  const dismissLevelUp = useCallback(() => setLevelUp(null), []);

  return {
    quests,
    completedCount: quests.filter((quest) => quest.completed).length,
    totalCount: quests.length,
    loading,
    error,
    levelUp,
    completeQuest,
    dismissLevelUp,
  };
}
