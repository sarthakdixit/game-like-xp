import {
  completeDailyQuest,
  createDailyQuest,
  getDailyQuestById,
  listDailyQuestsByDate,
} from '@/data/repositories/dailyQuestsRepository';
import { getDomainById, updateDomainProgress } from '@/data/repositories/domainsRepository';
import { getQuestById, listAllQuests } from '@/data/repositories/questsRepository';
import { createXpEvent } from '@/data/repositories/xpEventsRepository';
import type { FirestoreClient } from '@/data/firestoreClient';
import type { DailyQuest } from '@/data/schema';
import { ensureQuestsSeeded } from '@/data/seedQuests';
import { applyXpGain } from '@/domain/leveling';

/**
 * Generates today's daily quests — one per quest template that exists for
 * the user, i.e. every quest is active every day — if they don't exist yet
 * for `date`, and returns them either way. Idempotent per (user, date), so
 * it's safe to call on every app open.
 */
export async function generateDailyQuests(
  client: FirestoreClient,
  uid: string,
  date: string,
): Promise<DailyQuest[]> {
  const existing = await listDailyQuestsByDate(client, uid, date);
  if (existing.length > 0) {
    return existing;
  }

  await ensureQuestsSeeded(client, uid);
  const quests = await listAllQuests(client, uid);

  const created: DailyQuest[] = [];
  for (const quest of quests) {
    const dailyQuest = await createDailyQuest(client, uid, {
      id: `${date}_${quest.id}`,
      questId: quest.id,
      domainId: quest.domainId,
      date,
    });
    created.push(dailyQuest);
  }
  return created;
}

export interface CompleteDailyQuestResult {
  leveledUp: boolean;
  unlockedTitle: string | null;
}

/**
 * Marks a daily quest completed and awards its XP to the owning domain
 * through the leveling engine, recording an XP event for the audit trail.
 * Throws if the daily quest doesn't exist or is already completed —
 * callers (the UI hook) are expected to only offer completion on quests
 * that aren't done yet, so this should never fire in normal use.
 */
export async function completeDailyQuestAndAwardXp(
  client: FirestoreClient,
  uid: string,
  dailyQuestId: string,
  completedAt: string,
): Promise<CompleteDailyQuestResult> {
  const dailyQuest = await getDailyQuestById(client, uid, dailyQuestId);
  if (!dailyQuest) {
    throw new Error(`Daily quest ${dailyQuestId} not found`);
  }
  if (dailyQuest.completedAt) {
    throw new Error(`Daily quest ${dailyQuestId} is already completed`);
  }

  const quest = await getQuestById(client, uid, dailyQuest.questId);
  if (!quest) {
    throw new Error(`Quest template ${dailyQuest.questId} not found`);
  }

  const domain = await getDomainById(client, uid, dailyQuest.domainId);
  if (!domain) {
    throw new Error(`Domain ${dailyQuest.domainId} not found`);
  }

  const result = applyXpGain(
    { level: domain.level, xp: domain.xp, title: domain.title },
    quest.xpReward,
  );

  await completeDailyQuest(client, uid, dailyQuestId, completedAt);
  await createXpEvent(client, uid, {
    domainId: domain.id,
    amount: quest.xpReward,
    source: 'quest',
    sourceId: dailyQuestId,
  });
  await updateDomainProgress(client, uid, domain.id, {
    level: result.level,
    xp: result.xp,
    title: result.title,
  });

  return { leveledUp: result.leveledUp, unlockedTitle: result.unlockedTitle };
}
