import type { FirestoreClient } from '@/data/firestoreClient';
import { levelToRadarValue } from '@/domain/leveling';
import { RadarChart } from '@/ui/RadarChart';

import { DomainRow } from './DomainRow';
import { useDomains } from './useDomains';

import './HomeScreen.css';

export interface HomeScreenProps {
  uid: string;
  firestoreClientFactory?: () => FirestoreClient;
  onSelectDomain?: (domainId: string) => void;
}

export function HomeScreen({ uid, firestoreClientFactory, onSelectDomain }: HomeScreenProps) {
  const { domains, loading, error } = useDomains(uid, firestoreClientFactory);

  if (loading) {
    return <p data-testid="home-screen-loading">Loading your character sheet…</p>;
  }

  if (error) {
    return (
      <p role="alert" data-testid="home-screen-error">
        Couldn&apos;t load your character sheet.
      </p>
    );
  }

  const axes = domains.map((domain) => ({
    key: domain.key,
    label: domain.name,
    value: levelToRadarValue(domain.level),
  }));

  return (
    <div className="homeScreen" data-testid="home-screen">
      <div className="screenHead">
        <h2 className="display">Your standing</h2>
      </div>

      <div className="chartWrap">
        <RadarChart axes={axes} />
      </div>

      <div className="domainList">
        {domains.map((domain) => (
          <DomainRow key={domain.id} domain={domain} onSelect={onSelectDomain} />
        ))}
      </div>
    </div>
  );
}
