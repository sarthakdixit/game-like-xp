import {
  completeDailyQuest,
  createDailyQuest,
  getDailyQuestById,
  listDailyQuestsByDate,
} from '../../data/repositories/dailyQuestsRepository';
import {
  getDomainById,
  listDomains,
  updateDomainProgress,
} from '../../data/repositories/domainsRepository';
import { getQuestById, listQuestsByDomain } from '../../data/repositories/questsRepository';
import { createXpEvent } from '../../data/repositories/xpEventsRepository';
import type { DailyQuest, Domain, XpEvent } from '../../data/schema';
import type { SqliteClient } from '../../data/sqliteClient';
import { applyXpGain, titleForLevel } from '../../domain/leveling';
import { selectQuest } from '../../domain/questSelection';

export interface GenerateDailyQuestsOptions {
  random?: () => number;
  bossChance?: number;
}

/**
 * Ensures exactly one daily quest exists per domain for `date`. Idempotent — if
 * quests already exist for that date, returns them unchanged instead of generating
 * duplicates. Domains with no seeded quest templates are skipped defensively; in
 * normal operation every domain has templates (see `seedQuests`), so none are.
 */
export async function generateDailyQuests(
  db: SqliteClient,
  date: string,
  options: GenerateDailyQuestsOptions = {},
): Promise<DailyQuest[]> {
  const existing = await listDailyQuestsByDate(db, date);
  if (existing.length > 0) {
    return existing;
  }

  const domains = await listDomains(db);
  const created: DailyQuest[] = [];

  await db.withTransactionAsync(async () => {
    for (const domain of domains) {
      const quests = await listQuestsByDomain(db, domain.id);
      if (quests.length === 0) {
        continue;
      }

      const selection = selectQuest(
        quests.map((quest) => ({ id: quest.id, isBoss: quest.isBoss })),
        options.random,
        options.bossChance,
      );

      const dailyQuest = await createDailyQuest(db, {
        questId: selection.id,
        domainId: domain.id,
        date,
      });
      created.push(dailyQuest);
    }
  });

  return created;
}

export interface CompleteDailyQuestResult {
  dailyQuest: DailyQuest;
  xpEvent: XpEvent;
  domain: Domain;
  leveledUp: boolean;
  unlockedTitle: string | null;
}

/**
 * Marks a daily quest complete and awards its XP to the owning domain, running
 * the result through the Batch 2 leveling engine. Throws if the quest is missing
 * or already completed — callers own preventing a double-submit in the UI.
 */
export async function completeDailyQuestAndAwardXp(
  db: SqliteClient,
  dailyQuestId: string,
  completedAt: string,
): Promise<CompleteDailyQuestResult> {
  const dailyQuest = await getDailyQuestById(db, dailyQuestId);
  if (!dailyQuest) {
    throw new Error(`Daily quest ${dailyQuestId} not found`);
  }
  if (dailyQuest.completedAt) {
    throw new Error(`Daily quest ${dailyQuestId} is already completed`);
  }

  const quest = await getQuestById(db, dailyQuest.questId);
  if (!quest) {
    throw new Error(`Quest template ${dailyQuest.questId} not found`);
  }

  const domain = await getDomainById(db, dailyQuest.domainId);
  if (!domain) {
    throw new Error(`Domain ${dailyQuest.domainId} not found`);
  }

  const progress = applyXpGain(
    { level: domain.level, xp: domain.xp, title: domain.title ?? titleForLevel(domain.level) },
    quest.xpReward,
  );

  let xpEvent: XpEvent | undefined;

  await db.withTransactionAsync(async () => {
    await completeDailyQuest(db, dailyQuestId, completedAt);
    xpEvent = await createXpEvent(db, {
      domainId: domain.id,
      amount: quest.xpReward,
      source: 'quest',
      sourceId: dailyQuestId,
    });
    await updateDomainProgress(db, domain.id, {
      level: progress.level,
      xp: progress.xp,
      title: progress.title,
    });
  });

  const updatedDomain = await getDomainById(db, domain.id);
  if (!updatedDomain || !xpEvent) {
    throw new Error(`Failed to read back domain ${domain.id} after completing quest`);
  }

  return {
    dailyQuest: { ...dailyQuest, completedAt },
    xpEvent,
    domain: updatedDomain,
    leveledUp: progress.leveledUp,
    unlockedTitle: progress.unlockedTitle,
  };
}
