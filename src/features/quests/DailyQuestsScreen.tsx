import type { FirestoreClient } from '@/data/firestoreClient';

import { QuestCard } from './QuestCard';
import { useDailyQuests } from './useDailyQuests';

import './DailyQuestsScreen.css';

export interface DailyQuestsScreenProps {
  uid: string;
  firestoreClientFactory?: () => FirestoreClient;
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
            <h2 className="display">Five quests</h2>
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
            {quests.map((quest) => (
              <QuestCard key={quest.dailyQuestId} quest={quest} onComplete={completeQuest} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
