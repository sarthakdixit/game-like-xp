import type { CSSProperties } from 'react';

import type { Domain } from '@/data/schema';
import { titleForLevel, xpProgressToNextLevel } from '@/domain/leveling';
import { DomainIcon } from '@/ui/DomainIcon';
import { ProgressBar } from '@/ui/ProgressBar';
import { domainColor } from '@/ui/theme';

import './DomainRow.css';

export interface DomainRowProps {
  domain: Domain;
  onSelect?: (domainId: string) => void;
}

export function DomainRow({ domain, onSelect }: DomainRowProps) {
  const color = domainColor(domain.key);
  const title = domain.title ?? titleForLevel(domain.level);
  const progress = xpProgressToNextLevel(domain.level, domain.xp);

  const content = (
    <>
      <DomainIcon domainKey={domain.key} className="icon" />
      <span className="name">{domain.name}</span>
      <span className="lv">
        Lv {domain.level} · {title}
      </span>
      <div className="bar">
        <ProgressBar value={progress.ratio * 100} color={color} />
      </div>
    </>
  );

  const style = { '--tag': color } as CSSProperties;

  if (!onSelect) {
    return (
      <div className="domainRow" data-testid={`domain-row-${domain.key}`} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="domainRow domainRowButton"
      data-testid={`domain-row-${domain.key}`}
      style={style}
      onClick={() => onSelect(domain.id)}
      aria-label={`View ${domain.name} details`}
    >
      {content}
    </button>
  );
}
