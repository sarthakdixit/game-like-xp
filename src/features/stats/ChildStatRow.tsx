import type { ChildStatDisplay } from './useDomainDetail';

import './ChildStatRow.css';

export interface ChildStatRowProps {
  stat: ChildStatDisplay;
}

export function ChildStatRow({ stat }: ChildStatRowProps) {
  return (
    <div
      className={stat.isDecaying ? 'statLine decay' : 'statLine'}
      data-testid={`child-stat-row-${stat.key}`}
    >
      <span className="n">{stat.name}</span>
      <span className="v">
        {stat.displayValue}
        {stat.isDecaying ? <span className="note">decaying</span> : null}
      </span>
    </div>
  );
}
