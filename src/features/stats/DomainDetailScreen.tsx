import type { FirestoreClient } from '@/data/firestoreClient';
import { titleForLevel, xpForLevel, xpProgressToNextLevel } from '@/domain/leveling';
import { ProgressBar } from '@/ui/ProgressBar';
import { RadarChart } from '@/ui/RadarChart';
import { domainColor } from '@/ui/theme';

import { ChildStatRow } from './ChildStatRow';
import { useDomainDetail } from './useDomainDetail';

import './DomainDetailScreen.css';

export interface DomainDetailScreenProps {
  uid: string;
  domainId: string;
  firestoreClientFactory?: () => FirestoreClient;
  onBack?: () => void;
}

export function DomainDetailScreen({
  uid,
  domainId,
  firestoreClientFactory,
  onBack,
}: DomainDetailScreenProps) {
  const { domain, childStats, loading, error } = useDomainDetail(
    uid,
    domainId,
    firestoreClientFactory,
  );

  return (
    <div className="domainDetailScreen" data-testid="domain-detail-screen">
      {onBack ? (
        <button type="button" className="back" onClick={onBack}>
          ← Back to sheet
        </button>
      ) : null}

      {loading ? (
        <p data-testid="domain-detail-loading">Loading…</p>
      ) : error ? (
        <p role="alert" data-testid="domain-detail-error">
          Couldn&apos;t load this domain.
        </p>
      ) : !domain ? (
        <p role="alert" data-testid="domain-detail-not-found">
          This domain couldn&apos;t be found.
        </p>
      ) : (
        <DomainDetailContent domain={domain} childStats={childStats} />
      )}
    </div>
  );
}

interface DomainDetailContentProps {
  domain: NonNullable<ReturnType<typeof useDomainDetail>['domain']>;
  childStats: ReturnType<typeof useDomainDetail>['childStats'];
}

function DomainDetailContent({ domain, childStats }: DomainDetailContentProps) {
  const color = domainColor(domain.key);
  const title = domain.title ?? titleForLevel(domain.level);
  const progress = xpProgressToNextLevel(domain.level, domain.xp);
  const nextLevelXp = xpForLevel(domain.level + 1);

  const axes = childStats.map((stat) => ({
    key: stat.key,
    label: stat.name,
    value: stat.displayValue, // child stats are already a 0-100 gauge, no conversion needed
  }));

  return (
    <>
      <div className="screenHead">
        <p className="day" style={{ color }}>
          {domain.name} · level {domain.level}
        </p>
        <h2 className="display">{title}</h2>
      </div>

      <div className="xpbarWrap">
        <div className="row">
          <span>{domain.xp}xp</span>
          <span>next: {nextLevelXp}xp</span>
        </div>
        <ProgressBar
          testId="domain-detail-xp-bar"
          value={progress.ratio * 100}
          color="var(--gold)"
        />
      </div>

      {axes.length >= 3 ? (
        <div className="chartWrap">
          <RadarChart axes={axes} color={color} />
        </div>
      ) : null}

      <div className="statList">
        {childStats.map((stat) => (
          <ChildStatRow key={stat.id} stat={stat} />
        ))}
      </div>
    </>
  );
}
