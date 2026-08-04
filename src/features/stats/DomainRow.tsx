import type { CSSProperties } from 'react';

import type { Domain } from '@/data/schema';
import { titleForLevel, xpProgressToNextLevel } from '@/domain/leveling';
import { DomainIcon } from '@/ui/DomainIcon';
import { ProgressBar } from '@/ui/ProgressBar';
import { domainColor } from '@/ui/theme';

import './DomainRow.css';

export interface DomainRowProps {
  domain: Domain;
}

export function DomainRow({ domain }: DomainRowProps) {
  const color = domainColor(domain.key);
  const title = domain.title ?? titleForLevel(domain.level);
  const progress = xpProgressToNextLevel(domain.level, domain.xp);

  return (
    <div
      className="domainRow"
      data-testid={`domain-row-${domain.key}`}
      style={{ '--tag': color } as CSSProperties}
    >
      <DomainIcon domainKey={domain.key} className="icon" />
      <span className="name">{domain.name}</span>
      <span className="lv">
        Lv {domain.level} · {title}
      </span>
      <div className="bar">
        <ProgressBar value={progress.ratio * 100} color={color} />
      </div>
    </div>
  );
}
