import type { FirestoreClient } from '@/data/firestoreClient';

import { QuestCard } from './QuestCard';
import { useDailyQuests, type QuestDisplay } from './useDailyQuests';

import './DailyQuestsScreen.css';

export interface DailyQuestsScreenProps {
  uid: string;
  firestoreClientFactory?: () => FirestoreClient;
}

interface DomainGroup {
  domainKey: string;
  domainName: string;
  quests: QuestDisplay[];
}

/** Splits an already domain-sorted quest list into contiguous per-domain groups, for a heading per domain. */
function groupByDomain(quests: QuestDisplay[]): DomainGroup[] {
  const groups: DomainGroup[] = [];
  for (const quest of quests) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.domainKey === quest.domainKey) {
      lastGroup.quests.push(quest);
    } else {
      groups.push({ domainKey: quest.domainKey, domainName: quest.domainName, quests: [quest] });
    }
  }
  return groups;
}

export function DailyQuestsScreen({ uid, firestoreClientFactory }: DailyQuestsScreenProps) {
  const {
    quests,
    completedCount,
    totalCount,
    loading,
    error,
    levelUp,
    completeQuest,
    dismissLevelUp,
  } = useDailyQuests(uid, firestoreClientFactory);

  return (
    <div className="dailyQuestsScreen" data-testid="daily-quests-screen">
      {loading ? (
        <p data-testid="daily-quests-loading">Loading today&apos;s quests…</p>
      ) : error ? (
        <p role="alert" data-testid="daily-quests-error">
          Couldn&apos;t load today&apos;s quests.
        </p>
      ) : (
        <>
          <div className="screenHead">
            <p className="day">Today</p>
            <h2 className="display">{totalCount} quests</h2>
          </div>

          <p className="questProgress" data-testid="daily-quests-progress">
            {completedCount} of {totalCount} complete
          </p>

          {levelUp ? (
            <div className="levelUpBanner" role="status" data-testid="daily-quests-levelup">
              <span>
                {levelUp.domainName} leveled up! Now level {levelUp.level}
                {levelUp.unlockedTitle ? ` — ${levelUp.unlockedTitle}` : ''}.
              </span>
              <button type="button" onClick={dismissLevelUp} aria-label="Dismiss level-up notice">
                ×
              </button>
            </div>
          ) : null}

          <div className="questList">
            {groupByDomain(quests).map((group) => (
              <section key={group.domainKey} className="domainGroup">
                <h3 className="domainGroupHeading">{group.domainName}</h3>
                <div className="domainGroupQuests">
                  {group.quests.map((quest) => (
                    <QuestCard key={quest.dailyQuestId} quest={quest} onComplete={completeQuest} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
