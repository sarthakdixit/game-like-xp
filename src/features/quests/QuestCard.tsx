import type { CSSProperties } from 'react';

import { DomainIcon } from '@/ui/DomainIcon';
import { domainColor } from '@/ui/theme';

import type { QuestDisplay } from './useDailyQuests';

import './QuestCard.css';

export interface QuestCardProps {
  quest: QuestDisplay;
  onComplete: (dailyQuestId: string) => void;
}

/** A single daily quest card, matching the style guide's `.quest` component. */
export function QuestCard({ quest, onComplete }: QuestCardProps) {
  const style = { '--tag': domainColor(quest.domainKey) } as CSSProperties;

  return (
    <div
      className={`quest${quest.completed ? ' done' : ''}`}
      data-testid={`quest-card-${quest.dailyQuestId}`}
      style={style}
    >
      {quest.isBoss ? <span className="bossFlag display">Boss</span> : null}

      <button
        type="button"
        className="chk"
        role="checkbox"
        aria-checked={quest.completed}
        aria-label={quest.completed ? `${quest.text} — completed` : `Mark "${quest.text}" complete`}
        disabled={quest.completed}
        onClick={() => onComplete(quest.dailyQuestId)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>

      <DomainIcon domainKey={quest.domainKey} className="icon" />

      <div className="body">
        <p>{quest.text}</p>
      </div>

      <div className="xp">+{quest.xpReward}xp</div>
    </div>
  );
}
